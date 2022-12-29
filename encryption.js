function getMsg() {
	return msg = document.getElementById("msg").value;
}

function getMsgEncoding () {
	let enc = new TextEncoder();
	return enc.encode(getMsg());
}

function getKeyMaterial () {
	let pass = document.getElementById("password").value;
	let enc = new TextEncoder();
	return window.crypto.subtle.importKey(
		"raw",
		enc.encode(pass),
		"PBKDF2",
		false,
		["deriveKey"]
	);
}

function getKey (keyMaterial, salt) {
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

function bufTo64 (buf) {
	let bytes = new Uint8Array(buf);
	let ascii = ''
	for (var i = 0; i < bytes.byteLength; i++) {
		ascii += String.fromCharCode(bytes[i]);
	}
	return btoa(ascii);
}

function b64ToBuf (b64) {
	let ascii = atob(b64);
	let buf = new ArrayBuffer(ascii.length);
	let bytes = new Uint8Array(buf);
	for (var i = 0; i < ascii.length; i++) {
		bytes[i] = ascii.charCodeAt(i);
	}
	return buf;
}

function concatBuf(buf1, buf2) {
	let tmp = new Uint8Array(buf1.byteLength + buf2.byteLength);
	tmp.set(new Uint8Array(buf1), 0);
	tmp.set(new Uint8Array(buf2), buf1.byteLength);
	return tmp.buffer;
}

async function exportKey (key) {
	let k = await window.crypto.subtle.exportKey("raw", key);
	return bufTo64(k);
}

async function enc () {
	outBox = document.getElementById("ciphertext");
	outBox.innerHTML = '';

	let keyMaterial = await getKeyMaterial();
	let salt = window.crypto.getRandomValues(new Uint8Array(16));
	let key = await getKey(keyMaterial, salt);
	let iv = window.crypto.getRandomValues(new Uint8Array(16));
	let msgEncoded = getMsgEncoding();

	ciphertext = await window.crypto.subtle.encrypt(
		{
			"name": "AES-GCM",
			"iv": iv
		},
		key,
		msgEncoded
	);

	let output = {
		"ciphertext": bufTo64(ciphertext),
		"salt": bufTo64(salt),
		"iv": bufTo64(iv)
	}

	outBox.innerHTML = `${btoa(JSON.stringify(output))}`;
}

async function dec () {
	outBox = document.getElementById("plaintext");
	outBox.innerHTML = '';

	let msgEncoded = JSON.parse(atob(getMsg()));

	let ciphertext = new b64ToBuf(msgEncoded.ciphertext);
	let iv = new Uint8Array(b64ToBuf(msgEncoded.iv));
	let salt = new Uint8Array(b64ToBuf(msgEncoded.salt));

	let keyMaterial = await getKeyMaterial();
	let key = await getKey(keyMaterial, salt);

	try {
		let plaintext = await window.crypto.subtle.decrypt(
			{
				"name": "AES-GCM",
				"iv": iv
			},
			key,
			ciphertext
		);

		let dec = new TextDecoder();
		outBox.innerHTML = `${dec.decode(plaintext)}`;
	} catch (e) {
		window.alert("Decryption error: incorrect password?");
	}
}
