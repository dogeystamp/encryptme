class Form {
	constructor({id, formTag}) {
		this.id = id;

		if (formTag !== undefined) {
			this.handle = formTag;
		} else {
			this.handle = document.createElement("div");
		}

		this.elements = new Map();
	}

	#advanced = false;
	get advanced() {
		return this.#advanced;
	}
	set advanced(x) {
		this.#advanced = x;
		for (const [id, element] of this.elements.entries()) {
			if (element.advanced === true) {
				if (this.advanced === true) {
					element.hidden = false;
				} else {
					element.hidden = true;
				}
			}
		}
	}
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

function bufToB64 (buf) {
	let bytes = new Uint8Array(buf);
	let ascii = ''
	for (var i = 0; i < bytes.byteLength; i++) {
		ascii += String.fromCharCode(bytes[i]);
	}
	return btoa(ascii);
}

class FormElement {
	#enabled = true;
	get enabled() {
		return this.#enabled;
	}
	set enabled(x) {
		this.#enabled = x;
		this.handle.disabled = !this.#enabled;
	}

	#hidden = true;
	get hidden() {
		return this.#hidden;
	}
	set hidden(x) {
		this.#hidden = x;

		this.handle.hidden = this.hidden;
		if (this.label !== undefined) {
			this.label.hidden = this.hidden;
		}
	}

	constructor({id, type, form, label="", dataType="plaintext", advanced=false, enabled=true}) {
		this.id = id;

		this.advanced = advanced;

		if (label !== "") {
			this.label = document.createElement("label");
			this.label.innerHTML = label;
		}

		this.type = type;

		switch (type) {
			case "textbox":
				this.handle = document.createElement("input");
				break;
			case "password":
				this.handle = document.createElement("input");
				this.handle.setAttribute("type", "password");
				break;
			case "textarea":
				this.handle = document.createElement("textarea");
				break;
			case "button":
				this.handle = document.createElement("button");
				dataType = "none"
				break;
			case "output":
				this.handle = document.createElement("textarea");
				this.handle.setAttribute("readonly", true);
				break;
			default:
				throw `Unknown input type: ${type}`;
		}

		this.dataType = dataType;

		this.enabled = enabled;
		this.handle.id = this.id;

		if (this.advanced === true) this.hidden = true;

		if (form !== undefined) {
			this.form = form;
			if (this.label !== undefined) {
				this.label.setAttribute("for", this.id);
				form.handle.appendChild(this.label);
			}
			form.handle.appendChild(this.handle);
			form.elements.set(id, this);

			if (this.advanced === true) this.hidden = !form.advanced;
		}
	}

	// plaintext is string data
	// b64 is raw ArrayBuffer data
	// or none, which gives undefined
	#dataType = "none";
	get dataType() {
		return this.#dataType;
	}
	set dataType(x) {
		function err(type, x) {
			throw `'${type}' element can not support '${x}' data type`;
		}

		switch (x) {
			case "plaintext":
			case "b64":
				let valid = ["textbox", "password", "textarea", "output"];
				if (!valid.includes(this.type)) err(this.type, x);
				break;
			case "none":
				if (this.type !== "button") err(this.type, x);
				break;
			default:
				throw `Unknown data type: ${x}`;
		}

		this.#dataType = x;
	}
	
	#value;
	get value() {
		switch (this.dataType) {
			case "plaintext":
				return this.handle.value;
			case "b64":
				// TODO: error handling
				return b64ToBuf(this.handle.value);
			case "none":
				return undefined;
		}
	}
	set value(x) {
		switch (this.dataType) {
			case "plaintext":
				this.handle.value = x;
			case "b64":
				this.handle.value = bufToB64(x);
		}
	}
}
