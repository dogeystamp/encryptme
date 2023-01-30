/*

Copyright 2023 dogeystamp <dogeystamp@disroot.org>

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/

import { b64ToBuf, bufToB64 } from "./util.js";

class InterfaceElement {
	rootNodes = [];

	constructor({fragment, enabledFunc, visibleFunc}) {
		if (fragment === undefined) {
			this.fragment = new DocumentFragment();
		} else {
			this.fragment = fragment;
		}

		if (enabledFunc === undefined) {
			this.enabledFunc = function(){ return true; };
		} else {
			this.enabledFunc = enabledFunc;
		}
		if (visibleFunc === undefined) {
			this.visibleFunc = function(){ return true; };
		} else {
			this.visibleFunc = visibleFunc;
		}
	}

	update() {
		this.enabled = this.enabledFunc();
		this.hidden = !this.visibleFunc();
	}

	scanNodes() {
		this.rootNodes = [];
		for (const node of this.fragment.children) {
			this.rootNodes.push(node);
		}
	}

	mount(par) {
		this.scanNodes();
		par.append(this.fragment);
	}

	#hidden = false;
	get hidden() {
		return this.#hidden;
	}
	set hidden(x) {
		this.#hidden = x;

		for (const node of this.rootNodes) {
			node.hidden = this.hidden;
		}

		if (this.hidden === true) this.clearAlerts();
	}

	#enabled = true;
	get enabled() {
		return this.#enabled;
	}
	set enabled(x) {
		this.#enabled = x;
		this.handle.disabled = !this.#enabled;
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
	constructor({tag, par=document.body, label}) {
		super({});

		if (tag === undefined) {
			this.handle = document.createElement("div");
		} else {
			this.handle = tag;
		}

		this.fragment.appendChild(this.handle);

		this.elements = [];

		this.clearAlerts = this.clearAlerts.bind(this);

		if (label !== undefined) {
			this.createHeader({label: label});
		}

		let advancedToggle = this.createCheckBox({label: "Advanced settings"});
		advancedToggle.handle.addEventListener("change", function() {
			this.advanced = advancedToggle.value;
		}.bind(this));

		par.appendChild(this.fragment);
	}

	#hidden = false;
	get hidden() {
		return this.#hidden;
	}
	set hidden(x) {
		this.#hidden = x;

		for (const element of this.elements) {
			if (element.advanced === true) {
				element.hidden = !this.advanced || this.hidden;
			} else {
				element.hidden = this.hidden;
			}
		}

		if (this.hidden === true) this.clearAlerts();
	}

	#advanced = false;
	get advanced() {
		return this.#advanced;
	}
	set advanced(x) {
		this.#advanced = x;
		for (const element of this.elements) {
			if (element.advanced === true) {
				element.update();
			}
		}
	}

	clearAlerts() {
		for (const element of this.elements) {
			element.clearAlerts();
		}
	}

	createElem(params) {
		params.form = this;
		let elem = new FormElement(params);
		elem.mount(this.handle);
		this.elements.push(elem);
		this.rootNodes.push(...elem.rootNodes);
		if (elem.advanced) {
			elem.hidden = !this.advanced;
		}
		if (this.hidden) elem.hidden = true;
		return elem;
	}

	createHeader(params) {
		params.tag = document.createElement("h2");
		dataTypeSupports(params, ["none"]);
		let labelTag = document.createTextNode(params.label);
		params.tag.appendChild(labelTag);
		params.label = undefined;
		return this.createElem(params);
	}

	createTextBox(params) {
		params.tag = document.createElement("input");
		dataTypeSupports(params, ["plaintext", "b64", "json-b64"]);
		return this.createElem(params);
	}

	createMediumTextBox(params) {
		params.tag = document.createElement("textarea");
		params.tag.classList.add("mediumbox");
		dataTypeSupports(params, ["plaintext", "b64", "json-b64"]);
		return this.createElem(params);
	}

	createPasswordInput(params) {
		params.tag = document.createElement("input");
		params.tag.setAttribute("type", "password");
		dataTypeSupports(params, ["plaintext"]);
		return this.createElem(params);
	}

	createNumberInput(params) {
		params.tag = document.createElement("input");
		params.tag.setAttribute("type", "number");
		dataTypeSupports(params, ["number"]);
		if (params.maxValue !== undefined) params.tag.max = params.maxValue;
		if (params.minValue !== undefined) params.tag.min = params.minValue;
		if (params.step !== undefined) params.tag.step = params.step;
		if (params.required !== undefined) params.tag.required = params.required;
		return this.createElem(params);
	}

	createDropDown(params) {
		// example for params.options:
		/*
		[
			{
				value: "volvo"
				name: "Volvo"
			},
			{
				value: "benz"
				name: "Mercedes Benz"
			}
		]
		*/
		params.fragment = new DocumentFragment();
		params.tag = document.createElement("select");
		params.labelTag = document.createElement("label");
		params.labelTag.appendChild(document.createTextNode(params.label));
		params.fragment.appendChild(params.labelTag);
		params.fragment.appendChild(params.tag);
		dataTypeSupports(params, ["category"]);
		for (const option of params.options) {
			let optTag = document.createElement("option");
			optTag.value = option.value;
			optTag.appendChild(document.createTextNode(option.name));
			params.tag.appendChild(optTag);
		}
		params.tag.addEventListener("change", function() {
			for (const elem of this.elements) {
				elem.update();
			}
		}.bind(this));
		return this.createElem(params);
	}

	createTextArea(params) {
		params.tag = document.createElement("textarea");
		dataTypeSupports(params, ["plaintext", "b64", "json-b64"]);
		return this.createElem(params);
	}

	createButton(params) {
		params.fragment = new DocumentFragment();
		params.tag = document.createElement("button");
		params.labelTag = document.createTextNode(params.label);
		params.tag.appendChild(params.labelTag);
		params.fragment.appendChild(params.tag);
		dataTypeSupports(params, ["none"]);
		return this.createElem(params);
	}

	createCheckBox(params) {
		params.fragment = new DocumentFragment();
		params.tag = document.createElement("input");
		params.tag.setAttribute("type", "checkbox");
		params.labelTag = document.createElement("label");
		params.labelTag.appendChild(document.createTextNode(params.label));
		let li = document.createElement("li");
		li.classList.add("checkbox-container");
		params.fragment.appendChild(li);
		li.appendChild(params.tag);
		li.appendChild(params.labelTag);
		dataTypeSupports(params, ["bool"]);
		params.tag.addEventListener("change", function() {
			for (const elem of this.elements) {
				elem.update();
			}
		}.bind(this));
		return this.createElem(params);
	}

	createOutput(params) {
		params.tag = document.createElement("textarea");
		params.tag.setAttribute("readonly", true);
		dataTypeSupports(params, ["plaintext", "b64", "json-b64"]);
		return this.createElem(params);
	}
}

class FormElement extends InterfaceElement {
	constructor({tag, fragment, advanced=false, form,
		value, dataType, placeholder,
		labelTag, label="",
		enabledFunc,
		visibleFunc
	}) {
		let oriVisibleFunc = visibleFunc;

		super({
			fragment,
			enabledFunc,
			visibleFunc: function() {
				let res;
				if (oriVisibleFunc) {
					res = oriVisibleFunc();
				} else {
					res = true;
				}

				if (form !== undefined) {
					if (advanced) {
						if (form.advanced) return res;
						else return false;
					}
				}
				return res;
			}
		});

		this.form = form;

		this.labelText = label;
		if (labelTag === undefined) {
			this.labelTag = document.createElement("label");
			this.labelTag.appendChild(document.createTextNode(this.labelText));
			this.fragment.appendChild(this.labelTag);
			this.fragment.appendChild(tag);
		} else {
			this.labelTag = labelTag;
		}

		this.clearAlerts = this.clearAlerts.bind(this);

		this.handle = tag;
		this.dataType = dataType;
		this.advanced = advanced;

		if (value !== undefined) this.value = value;
		if (placeholder !== undefined) this.handle.placeholder = placeholder;
	}

	get value() {
		this.clearAlerts();
		switch (this.dataType) {
		case "number":
			if (this.handle.checkValidity() == false) {
				this.alertBox("alert-error", this.handle.validationMessage);
				return undefined;
			}
			return Number(this.handle.value);
		case "plaintext":
			return this.handle.value;
		case "b64":
			try {
				return b64ToBuf(this.handle.value);
			} catch (e) {
				this.handleError(Error("Invalid base64 value."));
				return undefined;
			}
		case "json-b64": {
			let jsonString;
			try {
				jsonString = atob(this.handle.value);
			} catch (e) {
				this.handleError(Error("Invalid base64 value."));
				return undefined;
			}
			try {
				return JSON.parse(jsonString);
			} catch (e) {
				this.handleError(Error("Invalid JSON encoding."));
				return undefined;
			}
		}
		case "bool":
			return this.handle.checked;
		case "category":
			return this.handle.value;
		default:
			return undefined;
		}
	}
	set value(x) {
		switch (this.dataType) {
		case "number":
		case "plaintext":
			this.handle.value = x;
			break;
		case "b64":
			this.handle.value = bufToB64(x);
			break;
		case "json-b64":
			this.handle.value = btoa(JSON.stringify(x));
			break;
		case "bool":
			this.handle.checked = x;
			break;
		case "category":
			this.handle.value = x;
			break;
		}
	}

	alerts = [];
	alertBox(type, message, title) {
		// type is alert-error or alert-info
		
		if (this.handle === undefined) {
			throw "can not add alert: still undefined";
		}

		if (this.hidden === true) {
			throw "can not add alert: hidden";
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
	handleError(e, extraInfo="") {
		if (extraInfo !== "") {
			extraInfo = ` (${extraInfo})`;
		}
		this.alertBox("alert-error", e.message + extraInfo);
		console.error(e);
	}
	clearAlerts() {
		for (const box of this.alerts) {
			box.remove();
		}
		this.alerts = [];
	}
}

class Tab extends InterfaceElement {
	constructor({form, label=""}) {
		super({});

		this.form = form;

		this.handle = document.createElement("button");
		this.fragment.appendChild(this.handle);

		this.handle.appendChild(document.createTextNode(label));
	}
}

class TabList extends InterfaceElement {
	constructor({tag, par=document.body}) {
		super({});

		this.par = par;

		if (tag === undefined) {
			this.handle = document.createElement("div");
			this.handle.classList.add("tabList");
		} else {
			this.handle = tag;
		}
		this.fragment.appendChild(this.handle);
		par.appendChild(this.fragment);
	}

	tabs = [];

	#activeForm;
	set activeForm(x) {
		this.#activeForm = x;
		for (const tab of this.tabs) {
			if (tab.form !== x) {
				tab.form.hidden = true;
				tab.handle.classList.remove("active");
			} else {
				tab.form.hidden = false;
				tab.handle.classList.add("active");
			}
		}
	}
	get activeForm() {
		return this.#activeForm;
	}

	createForm(params) {
		if (params.par === undefined) params.par = this.par;

		let form = new Form(params);

		let tab = new Tab({
			label: params.label,
			form: form
		});
		this.tabs.push(tab);

		tab.handle.addEventListener("click", function() {
			this.activeForm = form;
		}.bind(this));

		this.handle.appendChild(tab.fragment);

		if (this.activeForm === undefined) this.activeForm = form;
		else form.hidden = true;

		return form;
	}
}

export { TabList, FormElement, Form };
