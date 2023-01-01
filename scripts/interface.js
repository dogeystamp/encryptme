class InterfaceElement {
	constructor({id, tag}) {
		this.id = id;
		if (tag !== undefined) {
			this.handle = tag;
		}
	}

	#hidden = false;
	get hidden() {
		return this.#hidden;
	}
	set hidden(x) {
		this.#hidden = x;

		this.handle.hidden = this.hidden;
		if (this.label !== undefined) {
			this.label.hidden = this.hidden;
		}

		if (this.hidden === true) this.clearAlerts();
	}

}

class Form extends InterfaceElement {
	constructor({id, tag}) {
		super({id, tag});

		if (tag === undefined) {
			this.handle = document.createElement("div");
		}

		this.elements = new Map();

		this.clearAlerts = this.clearAlerts.bind(this);
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

	clearAlerts() {
		for (const [id, element] of this.elements.entries()) {
			element.clearAlerts();
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

class FormElement extends InterfaceElement {
	#enabled = true;
	get enabled() {
		return this.#enabled;
	}
	set enabled(x) {
		this.#enabled = x;
		this.handle.disabled = !this.#enabled;
	}

	constructor({id, type, form, tag, label="", dataType="plaintext", advanced=false, enabled=true}) {
		super({id});
		this.id = id;

		this.advanced = advanced;
		this.type = type;

		this.clearAlerts = this.clearAlerts.bind(this);

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
				this.handle.appendChild(document.createTextNode(label));
				label = "";
				dataType = "none"
				break;
			case "output":
				this.handle = document.createElement("textarea");
				this.handle.setAttribute("readonly", true);
				break;
			default:
				throw `Unknown input type: ${type}`;
		}

		if (label !== "") {
			this.label = document.createElement("label");
			this.label.appendChild(document.createTextNode(label));
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
	// json-b64 is Object data
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
			case "json-b64":
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
	
	get value() {
		this.clearAlerts();
		switch (this.dataType) {
			case "plaintext":
				return this.handle.value;
			case "b64":
				try {
					return b64ToBuf(this.handle.value);
				} catch (e) {
					this.alertBox("alert-error", "Invalid base64 value.");
					return;
				}
			case "json-b64":
				let jsonString;
				try {
					jsonString = atob(this.handle.value);
				} catch (e) {
					this.alertBox("alert-error", "Invalid base64 value.");
					return;
				}
				try {
					return JSON.parse(jsonString);
				} catch (e) {
					this.alertBox("alert-error", "Invalid JSON encoding.");
					return;
				}
			case "none":
				return undefined;
		}
	}
	set value(x) {
		switch (this.dataType) {
			case "plaintext":
				this.handle.value = x;
				break;
			case "b64":
				this.handle.value = bufToB64(x);
				break;
			case "json-b64":
				this.handle.value = btoa(JSON.stringify(x));
				break;
		}
	}

	alerts = [];
	alertBox(type, message, title) {
		// type is alert-error or alert-info
		
		if (this.handle === undefined) {
			throw `can not add alert for '${this.id}': still undefined`;
		}

		if (this.hidden === true) {
			throw `can not add alert for '${this.id}': hidden`;
		}

		if (title === undefined) {
			switch (type) {
				case "alert-info":
					title = "Info: ";
					break;
				case "alert-error":
					title = "Error: ";
					break;
				default:
					title = "";
					break;
			}
		}

		let box = document.createElement("div");
		box.classList.add(type);
		box.classList.add("alert");
		box.appendChild(document.createTextNode(message));

		if (title !== "") {
			let titleTag = document.createElement("strong");
			titleTag.appendChild(document.createTextNode(title));
			box.prepend(titleTag);
		}

		this.handle.after(box);
		this.alerts.push(box);
	}
	clearAlerts() {
		for (const box of this.alerts) {
			box.remove();
		}
		this.alerts = [];
	}
}
