let encForm = new Form({id: "encryption", tag: document.getElementById("encryption")});
let encMsg = new FormElement({
	id: "msg",
	type: "textarea",
	label: "Message",
	form: encForm
});
let encPass = new FormElement({
	id: "password",
	type: "password",
	label: "Password",
	form: encForm
});
let encButton = new FormElement({
	id: "button",
	type: "button",
	label: "Encrypt",
	form: encForm
});
let encOut = new FormElement({
	id: "output",
	type: "output",
	label: "Output",
	dataType: "json-b64",
	form: encForm
});

let decForm = new Form({id: "decryption", tag: document.getElementById("decryption")});
let decMsg = new FormElement({
	id: "msg",
	type: "textarea",
	label: "Encrypted message",
	dataType: "json-b64",
	form: decForm
});
let decPass = new FormElement({
	id: "password",
	type: "password",
	label: "Password",
	form: decForm
});
let decButton = new FormElement({
	id: "button",
	type: "button",
	label: "Decrypt",
	form: decForm
});
let decOut = new FormElement({
	id: "output",
	type: "output",
	label: "Output",
	form: decForm
});

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

function getKey(keyMaterial, salt) {
	return window.crypto.subtle.deriveKey(
		{
			"name": "PBKDF2",
			"hash": "SHA-256",
			"salt": salt,
			"iterations": 300000
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

async function encrypt() {
	let keyMaterial = await getKeyMaterial(encPass.value);
	let salt = window.crypto.getRandomValues(new Uint8Array(16));
	let key = await getKey(keyMaterial, salt);

	let iv = window.crypto.getRandomValues(new Uint8Array(16));

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

	encOut.value = {
		"ciphertext": bufToB64(ciphertext),
		"salt": bufToB64(salt),
		"iv": bufToB64(iv)
	}
}

async function decrypt() {
	let msgEncoded = decMsg.value;

	let ciphertext = new b64ToBuf(msgEncoded.ciphertext);
	let iv = new Uint8Array(b64ToBuf(msgEncoded.iv));
	let salt = new Uint8Array(b64ToBuf(msgEncoded.salt));

	let keyMaterial = await getKeyMaterial(decPass.value);
	let key = await getKey(keyMaterial, salt);

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
		window.alert("Decryption error: incorrect password?");
	}

	let dec = new TextDecoder();
	decOut.value = `${dec.decode(plaintext)}`;
}

encButton.handle.addEventListener("click", encrypt);
decButton.handle.addEventListener("click", decrypt);
