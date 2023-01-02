let encForm = new Form({id: "encryption", tag: document.getElementById("encryption")});

let encMsg = encForm.createTextArea({label: "Message"});
let encPass = encForm.createPasswordInput({label: "Password"});
let encButton = encForm.createButton({label: "Encrypt"});
let encOut = encForm.createOutput({
	label: "Output",
	dataType: "json-b64",
});

let decForm = new Form({id: "decryption", tag: document.getElementById("decryption")});

let decMsg = decForm.createTextArea({
	label: "Encrypted message",
	dataType: "json-b64",
});
let decPass = decForm.createPasswordInput({label: "Password"});
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
		decPass.alertBox("alert-error", "Decryption error: incorrect password?");
	}

	let dec = new TextDecoder();
	decOut.value = `${dec.decode(plaintext)}`;
}

encButton.handle.addEventListener("click", encrypt);
decButton.handle.addEventListener("click", decrypt);
