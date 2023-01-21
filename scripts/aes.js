let tabs = new TabList({});

let encForm = tabs.createForm({label: "Encryption"});

let encMsg = encForm.createTextArea({label: "Message"});
let encPass = encForm.createPasswordInput({
	label: "Password",
	enabledFunc: function() {return !encManualKey.value}
});
let encPbkdf2Iters = encForm.createNumberInput({
	label: "PBKDF2 iterations",
	minValue: 1,
	step: 1,
	value: 300000,
	advanced: true,
	enabledFunc: function() {return !encManualKey.value}
});
let encSalt = encForm.createMediumTextBox({
	label: "PBKDF2 salt",
	dataType: "b64",
	advanced: true,
	enabled: false,
	enabledFunc: function() {return encManualSalt.value && !encManualKey.value}
});
let encManualSalt = encForm.createCheckBox({
	label: "Use fixed salt instead of random",
	advanced: true
});
let encKey = encForm.createMediumTextBox({
	label: "Key",
	dataType: "b64",
	advanced: true,
	enabled: false,
	enabledFunc: function() {return encManualKey.value}
});
let encManualKey = encForm.createCheckBox({
	label: "Use fixed key instead of password",
	advanced: true
});
let encIV = encForm.createMediumTextBox({
	label: "IV",
	dataType: "b64",
	advanced: true,
	enabledFunc: function() {return encManualIV.value}
});
let encManualIV = encForm.createCheckBox({
	label: "Use fixed IV instead of random",
	advanced: true
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
	dataType: "json-b64",
});
let decPass = decForm.createPasswordInput({
	label: "Password",
	enabledFunc: function() {return !decManualKey.value}
});
let decKey = decForm.createMediumTextBox({
	label: "Key",
	dataType: "b64",
	advanced: true,
	enabled: false,
	enabledFunc: function() {return decManualKey.value}
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

function getKey(keyMaterial, salt, pbkdf2Iters) {
	return window.crypto.subtle.deriveKey(
		{
			"name": "PBKDF2",
			"hash": "SHA-256",
			"salt": salt,
			"iterations": pbkdf2Iters
		},
		keyMaterial,
		{
			"name": "AES-GCM",
			"length": 256
		},
		true,
		["encrypt", "decrypt"]
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
			{"name": "AES-GCM"},
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

		key = await getKey(keyMaterial, salt, pbkdf2Iters);
		encKey.value = await window.crypto.subtle.exportKey("raw", key);
	}

	let iv;
	if (encManualIV.value) {
		iv = encIV.value;
	} else {
		iv = window.crypto.getRandomValues(new Uint8Array(16));
		encIV.value = iv;
	}

	let enc = new TextEncoder();
	let msgEncoded = enc.encode(encMsg.value);

	let ciphertext = await window.crypto.subtle.encrypt(
		{
			"name": "AES-GCM",
			"iv": iv
		},
		key,
		msgEncoded
	);

	encOutRaw.value = ciphertext;

	encOut.value = {
		"ciphertext": bufToB64(ciphertext),
		"salt": bufToB64(salt),
		"iv": bufToB64(iv),
		"pbkdf2Iters": pbkdf2Iters
	}
});

decButton.handle.addEventListener("click", async function() {
	let msgEncoded = decMsg.value;

	let ciphertext, iv, salt, pbkdf2Iters;
	try {
		ciphertext = new b64ToBuf(msgEncoded.ciphertext);
		iv = new Uint8Array(b64ToBuf(msgEncoded.iv));
		salt = new Uint8Array(b64ToBuf(msgEncoded.salt));
		pbkdf2Iters = msgEncoded.pbkdf2Iters;
		if (pbkdf2Iters < 1 || pbkdf2Iters%1 !== 0) {
			decMsg.alertBox("alert-error", "Invalid PBKDF2 iters setting.");
		} else if (pbkdf2Iters > 1000000) {
			decMsg.alertBox("alert-info", `PBKDF2 is using ${pbkdf2Iters} iterations: this might take a long time...`);
		}
	} catch (e) {
		decMsg.alertBox("alert-error", "Invalid encrypted payload.");
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
		key = await window.crypto.subtle.importKey(
			"raw",
			decKey.value,
			{"name": "AES-GCM"},
			true,
			["encrypt", "decrypt"]
		);
	} else {
		key = await getKey(keyMaterial, salt, pbkdf2Iters);
	}

	let plaintext;

	try {
		plaintext = await window.crypto.subtle.decrypt(
			{
				"name": "AES-GCM",
				"iv": iv
			},
			key,
			ciphertext
		);
	} catch (e) {
		decPass.alertBox("alert-error", "Decryption error: incorrect password?");
	}

	let dec = new TextDecoder();
	decOut.value = `${dec.decode(plaintext)}`;
});
