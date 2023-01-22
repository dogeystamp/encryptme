# encryptme

encryptme is a website that provides cryptography tools based on the browser's SubtleCrypto API.
It aims to be simple to use, but also allow users to tinker with more advanced options if needed.

Currently, the following algorithms are implemented:

* [AES encryption/decryption](https://dogeystamp.github.io/encryptme/aes.html)

	This uses PBKDF2 to convert a password to a key, then uses 256-bit AES-GCM
	to encrypt a given message.
