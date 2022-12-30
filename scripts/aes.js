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
	form: form
});
