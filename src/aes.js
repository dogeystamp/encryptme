/*

Copyright 2023 dogeystamp <dogeystamp@disroot.org>

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/

import { generateHeader } from "./templates.js";
import "./style.css";
generateHeader();

import { TabList } from "./interface.js";
import { bufToB64, b64ToBuf } from "./util.js";

let tabs = new TabList({});

let encForm = tabs.createForm({label: "Encryption"});

let encMsg = encForm.createTextArea({
	label: "Message",
	placeholder: "Type a secret message",
});
let encPass = encForm.createPasswordInput({
	label: "Password",
	placeholder: "Enter your password",
	enabledFunc: function() {return !encManualKey.value;}
});
let encPbkdf2Iters = encForm.createNumberInput({
	label: "PBKDF2 iterations",
	minValue: 1,
	step: 1,
	value: 300000,
	advanced: true,
	enabledFunc: function() {return !encManualKey.value;}
});
let encSalt = encForm.createMediumTextBox({
	label: "PBKDF2 salt",
	dataType: "b64",
	advanced: true,
	enabled: false,
	enabledFunc: function() {return encManualSalt.value && !encManualKey.value;}
});
let encManualSalt = encForm.createCheckBox({
	label: "Use fixed salt instead of random",
	advanced: true
});
let encKeySize = encForm.createDropDown({
	label: "AES key size",
	advanced: true,
	options: [
		{
			name: "128 bits",
			value: 128
		},
		{
			name: "256 bits",
			value: "256"
		},
	]
});
let encKey = encForm.createMediumTextBox({
	label: "Key",
	dataType: "b64",
	advanced: true,
	enabled: false,
	enabledFunc: function() {return encManualKey.value;}
});
let encManualKey = encForm.createCheckBox({
	label: "Use fixed key instead of password",
	advanced: true
});
let encIV = encForm.createMediumTextBox({
	label: "IV",
	dataType: "b64",
	advanced: true,
	enabledFunc: function() {return encManualIV.value;},
	visibleFunc: function() {return ["AES-GCM", "AES-CBC"].includes(encMode.value);}
});
let encManualIV = encForm.createCheckBox({
	label: "Use fixed IV instead of random",
	advanced: true,
	visibleFunc: function() {return ["AES-GCM", "AES-CBC"].includes(encMode.value);}
});
let encCounter = encForm.createMediumTextBox({
	label: "Counter",
	dataType: "b64",
	advanced: true,
	enabledFunc: function() {return encManualCounter.value;},
	visibleFunc: function() {return encMode.value === "AES-CTR";}
});
let encManualCounter = encForm.createCheckBox({
	label: "Use fixed counter instead of random",
	advanced: true,
	visibleFunc: function() {return encMode.value === "AES-CTR";}
});
let encMode = encForm.createDropDown({
	label: "AES mode",
	advanced: true,
	options: [
		{
			name: "AES-GCM (Galois/Counter Mode)",
			value: "AES-GCM"
		},
		{
			name: "AES-CBC (Cipher Block Chaining)",
			value: "AES-CBC"
		},
		{
			name: "AES-CTR (Counter)",
			value: "AES-CTR"
		},
	]
});
let encButton = encForm.createButton({label: "Encrypt"});
let encOut = encForm.createOutput({
	label: "Output",
	dataType: "json-b64",
});
let encOutRaw = encForm.createOutput({
	label: "Raw ciphertext",
	dataType: "b64",
	advanced: true
});

let decForm = tabs.createForm({label: "Decryption"});

let decMsg = decForm.createTextArea({
	label: "Encrypted message",
	placeholder: "Paste the encrypted output",
	dataType: "json-b64",
});
let decPass = decForm.createPasswordInput({
	label: "Password",
	placeholder: "Enter your password",
	enabledFunc: function() {return !decManualKey.value;}
});
let decKey = decForm.createMediumTextBox({
	label: "Key",
	dataType: "b64",
	advanced: true,
	enabled: false,
	enabledFunc: function() {return decManualKey.value;}
});
let decManualKey = decForm.createCheckBox({
	label: "Use fixed key instead of password",
	advanced: true
});
let decButton = decForm.createButton({label: "Decrypt"});
let decOut = decForm.createOutput({label: "Output"});

function getKeyMaterial(password) {
	let enc = new TextEncoder();
	return window.crypto.subtle.importKey(
		"raw",
		enc.encode(password),
		"PBKDF2",
		false,
		["deriveKey"]
	);
}

function getKey(keyMaterial, salt, pbkdf2Iters, encMode, keySize) {
	return window.crypto.subtle.deriveKey(
		{
			"name": "PBKDF2",
			"hash": "SHA-256",
			"salt": salt,
			"iterations": pbkdf2Iters
		},
		keyMaterial,
		{
			"name": encMode,
			"length": keySize
		},
		true,
		["encrypt", "decrypt"]
	);
}

async function aesGcmEnc(key, iv, msgEncoded) {
	return window.crypto.subtle.encrypt(
		{
			"name": "AES-GCM",
			"iv": iv
		},
		key,
		msgEncoded
	);
}
async function aesCbcEnc(key, iv, msgEncoded) {
	return window.crypto.subtle.encrypt(
		{
			"name": "AES-CBC",
			"iv": iv
		},
		key,
		msgEncoded
	);
}
async function aesCtrEnc(key, counter, msgEncoded) {
	return window.crypto.subtle.encrypt(
		{
			"name": "AES-CTR",
			"counter": counter,
			"length": 64
		},
		key,
		msgEncoded
	);
}

encButton.handle.addEventListener("click", async function() {
	let keyMaterial = await getKeyMaterial(encPass.value);
	let key;
	let salt = encSalt.value;
	let pbkdf2Iters = encPbkdf2Iters.value;

	if (pbkdf2Iters === undefined) return;
	if (pbkdf2Iters > 1000000) {
		encPbkdf2Iters.alertBox("alert-info", `PBKDF2 is using ${pbkdf2Iters} iterations: this might take a long time...`);
	}

	if (encManualKey.value) {
		key = await window.crypto.subtle.importKey(
			"raw",
			encKey.value,
			{"name": encMode.value},
			true,
			["encrypt", "decrypt"]
		);
	} else {
		if (encSalt.enabledFunc()) {
			salt = encSalt.value;
		} else {
			salt = window.crypto.getRandomValues(new Uint8Array(16));
			encSalt.value = salt;
		}

		key = await getKey(keyMaterial, salt, pbkdf2Iters, encMode.value, Number(encKeySize.value));
		encKey.value = await window.crypto.subtle.exportKey("raw", key);
	}

	let iv;
	if (["AES-GCM", "AES-CBC"].includes(encMode.value)) {
		if (encManualIV.value) {
			iv = encIV.value;
		} else {
			iv = window.crypto.getRandomValues(new Uint8Array(16));
			encIV.value = iv;
		}
	}

	let counter;
	if (encMode.value === "AES-CTR") {
		if (encManualCounter.value) {
			counter = encCounter.value;
		} else {
			counter = window.crypto.getRandomValues(new Uint8Array(16));
			encCounter.value = counter;
		}
	}

	let enc = new TextEncoder();
	let msgEncoded = enc.encode(encMsg.value);

	let ciphertext; 
	switch (encMode.value) {
	case "AES-GCM":
		ciphertext = await aesGcmEnc(key, iv, msgEncoded);
		break;
	case "AES-CBC":
		ciphertext = await aesCbcEnc(key, iv, msgEncoded);
		break;
	case "AES-CTR":
		ciphertext = await aesCtrEnc(key, counter, msgEncoded);
		break;
	default:
		encMode.handleError(Error(`Mode '${encMode.value}' is not implemented.`));
		return;
	}

	encOutRaw.value = ciphertext;

	encOut.value = {
		"ciphertext": bufToB64(ciphertext),
		"salt": bufToB64(salt),
		"iv": bufToB64(iv),
		"counter": bufToB64(counter),
		"encMode": encMode.value,
		"encKeySize": encKeySize.value,
		"pbkdf2Iters": pbkdf2Iters,
	};
});

async function aesGcmDec(key, iv, ciphertext) {
	return window.crypto.subtle.decrypt(
		{
			"name": "AES-GCM",
			"iv": iv
		},
		key,
		ciphertext
	);
}
async function aesCbcDec(key, iv, ciphertext) {
	return window.crypto.subtle.decrypt(
		{
			"name": "AES-CBC",
			"iv": iv
		},
		key,
		ciphertext
	);
}
async function aesCtrDec(key, counter, ciphertext) {
	return window.crypto.subtle.decrypt(
		{
			"name": "AES-CTR",
			"counter": counter,
			"length": 64
		},
		key,
		ciphertext
	);
}

decButton.handle.addEventListener("click", async function() {
	let msgEncoded = decMsg.value;

	let ciphertext, iv, counter, salt, encMode, pbkdf2Iters, encKeySize;
	try {
		ciphertext = new b64ToBuf(msgEncoded.ciphertext);
		iv = new Uint8Array(b64ToBuf(msgEncoded.iv));
		counter = new Uint8Array(b64ToBuf(msgEncoded.counter));
		salt = new Uint8Array(b64ToBuf(msgEncoded.salt));
		encMode = msgEncoded.encMode;
		encKeySize = msgEncoded.encKeySize;
		if (!["128", "256"].includes(encKeySize)) {
			throw Error(`Invalid AES key size: '${encKeySize}'`);
		}
		pbkdf2Iters = msgEncoded.pbkdf2Iters;
		if (pbkdf2Iters < 1 || pbkdf2Iters%1 !== 0) {
			throw Error(`Invalid PBKDF2 iterations setting: ${pbkdf2Iters}`);
		} else if (pbkdf2Iters > 1000000) {
			decMsg.alertBox("alert-info", `PBKDF2 is using ${pbkdf2Iters} iterations: this might take a long time...`);
		}
	} catch (e) {
		decMsg.handleError(e, "Invalid encrypted payload.");
	}

	if (ciphertext === undefined
		|| iv === undefined
		|| salt === undefined
		|| pbkdf2Iters === undefined
	) {
		return;
	}

	let keyMaterial = await getKeyMaterial(decPass.value);
	let key;
	if (decManualKey.value) {
		try {
			key = await window.crypto.subtle.importKey(
				"raw",
				decKey.value,
				{"name": encMode},
				true,
				["encrypt", "decrypt"]
			);
		} catch (e) {
			decMsg.handleError(e);
		}
	} else {
		key = await getKey(keyMaterial, salt, pbkdf2Iters, encMode, Number(encKeySize));
		decKey.value = await window.crypto.subtle.exportKey("raw", key);
	}

	let plaintext;

	try {
		switch (encMode) {
		case "AES-GCM":
			plaintext = await aesGcmDec(key, iv, ciphertext);
			break;
		case "AES-CBC":
			plaintext = await aesCbcDec(key, iv, ciphertext);
			break;
		case "AES-CTR":
			plaintext = await aesCtrDec(key, counter, ciphertext);
			break;
		default:
			throw Error(`Mode '${encMode.value}' is not implemented.`);
		}
	} catch (e) {
		if (e.message !== ""  && e.message !== undefined) {
			decMsg.handleError(e, "Error during decryption.");
		} else {
			decMsg.handleError(Error("Could not decrypt; is your password/key correct?"));
		}
	}

	let dec = new TextDecoder();
	decOut.value = `${dec.decode(plaintext)}`;
});
