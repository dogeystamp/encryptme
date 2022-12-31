let form = new Form({id: "encryption"});
document.body.appendChild(form.handle);

let inp = new FormElement({
	id: "textbox",
	type: "textbox",
	label: "Text box",
	form: form
});

let inp2 = new FormElement({
	id: "password",
	type: "password",
	label: "Password",
	form: form
});

let inp3 = new FormElement({
	id: "textarea",
	type: "textarea",
	label: "Large text box",
	enabled: true,
	dataType: "b64",
	form: form
});

let inp4 = new FormElement({
	id: "textarea",
	type: "textarea",
	label: "Large text box (disabled)",
	enabled: false,
	form: form
});

let out = new FormElement({
	id: "output",
	type: "output",
	label: "Output box",
	dataType: "b64",
	form: form
});

let button = new FormElement({
	id: "button",
	type: "button",
	label: "Do things",
	form: form
});

let outAdvanced = new FormElement({
	id: "output-advanced",
	type: "output",
	label: "Output box (advanced setting)",
	advanced: true,
	form: form
});

inp.alertBox("alert-info", "Pater noster qui es in caelo sanctificetur nomen tuum adveniat regnum tuum.");
button.handle.addEventListener("click", form.clearAlerts);
