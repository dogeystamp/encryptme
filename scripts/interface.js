class InterfaceElement {
	constructor({tag}) {
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

function dataTypeSupports(params, validTypes) {
	if (params.dataType === undefined) {
		params.dataType = validTypes[0];
	}
	if (!validTypes.includes(params.dataType)) {
		throw `Element can not support '${params.dataType}' data type`;
	}
}

class Form extends InterfaceElement {
	constructor({tag}) {
		super({tag});

		if (tag === undefined) {
			this.handle = document.createElement("div");
		}

		this.elements = [];

		this.clearAlerts = this.clearAlerts.bind(this);
	}

	#advanced = false;
	get advanced() {
		return this.#advanced;
	}
	set advanced(x) {
		this.#advanced = x;
		for (const element of this.elements) {
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
		for (const element of this.elements) {
			element.clearAlerts();
		}
	}

	appendElement(elem) {
		this.handle.append(elem.fragment);
		return elem;
	}

	createTextBox(params) {
		params.tag = document.createElement("input");
		dataTypeSupports(params, ["plaintext", "b64", "json-b64"]);
		return this.appendElement(new FormElement(params));
	}

	createPasswordInput(params) {
		params.tag = document.createElement("input");
		params.tag.setAttribute("type", "password");
		dataTypeSupports(params, ["plaintext"]);
		return this.appendElement(new FormElement(params));
	}

	createTextArea(params) {
		params.tag = document.createElement("textarea");
		dataTypeSupports(params, ["plaintext", "b64", "json-b64"]);
		return this.appendElement(new FormElement(params));
	}

	createButton(params) {
		params.tag = document.createElement("button");
		params.tag.appendChild(document.createTextNode(params.label));
		params.label = "";
		dataTypeSupports(params, ["none"]);
		return this.appendElement(new FormElement(params));
	}

	createOutput(params) {
		params.tag = document.createElement("textarea");
		params.tag.setAttribute("readonly", true);
		dataTypeSupports(params, ["plaintext", "b64", "json-b64"]);
		return this.appendElement(new FormElement(params));
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

	constructor({form, tag, label="", dataType, advanced=false, enabled=true}) {
		super({tag});

		this.advanced = advanced;

		this.clearAlerts = this.clearAlerts.bind(this);

		if (label !== "") {
			this.label = document.createElement("label");
			this.label.appendChild(document.createTextNode(label));
		}

		this.dataType = dataType;

		this.enabled = enabled;

		if (this.advanced === true) this.hidden = true;

		this.fragment = new DocumentFragment();
		if (this.label !== undefined) {
			this.fragment.appendChild(this.label);
		}
		this.fragment.appendChild(this.handle);

		if (this.advanced === true) this.hidden = !form.advanced;
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
			throw `can not add alert: still undefined`;
		}

		if (this.hidden === true) {
			throw `can not add alert: hidden`;
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
