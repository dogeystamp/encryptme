# encryptme

encryptme is a website that provides cryptography tools based on the browser's SubtleCrypto API.
It aims to be simple to use, but also allow users to tinker with more advanced options if needed.

![AES encryption page](./media/aes_enc.jpg)

Currently, the following algorithms are implemented:

* [AES encryption/decryption](https://dogeystamp.github.io/encryptme/aes.html)

	This uses PBKDF2 to convert a password to a key, then uses AES
	to encrypt a given message.

## Installation

Clone the repo:

```
git clone https://github.com/dogeystamp/encryptme
```

Install packages:

```
npm install
```

## Running

Start development server:
	
```
npm run start
```

Or, compile to `dist/`:

```
npm run build
```
