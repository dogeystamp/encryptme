class Form {
	constructor(id, formTag) {
		this.id = id;

		if (formTag !== undefined) {
			this.handle = formTag;
		} else {
			this.handle = document.createElement("div");
		}

		this.inputs = new Map();
	}
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

	constructor({id, type, form, label="", dataType="plaintext", advanced=false, enabled=true}) {
		this.id = id;
		this.dataType = dataType;
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
				break;
			case "output":
				this.handle = document.createElement("textarea");
				this.handle.setAttribute("readonly", true);
				break;
			default:
				console.error(`Unknown input type: ${type}`)
				return;
		}

		this.enabled = enabled;

		if (form !== undefined) {
			if (this.label !== undefined) {
				this.label.setAttribute("for", form.id);
				form.handle.appendChild(this.label);
			}
			form.handle.appendChild(this.handle);
		}
	}
}
