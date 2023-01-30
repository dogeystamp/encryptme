function generateHeader() {
	let header = document.createElement("div");
	header.classList.add("page-header");

	header.innerHTML = `
	<a href="index.html"><h1>encryptme</h1></a>
	`;
	document.body.prepend(header);
}

export { generateHeader };
