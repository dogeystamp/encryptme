const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const SitemapPlugin = require("sitemap-webpack-plugin").default;
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const pages = [
	{
		id: "index",
		desc: "Easy to use and simple online tools for encryption and decryption.",
		changefreq: "weekly",
		priority: 1.0,
	},
	{
		id: "aes",
		desc: "Secure and simple tool for AES, with control over all advanced options like key size, salt, AES mode, and others.",
		changefreq: "weekly",
		priority: 0.7,
	},
];

module.exports = {
	entry: pages.reduce((config, page) => {
		config[page.id] = `./src/${page.id}.js`;
		return config;
	}, {}),
	output: {
		filename: "[name].js",
		path: path.resolve(__dirname, "dist"),
		clean: true,
	},
	optimization: {
		splitChunks: {
			chunks: "all",
		},
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: "[contenthash].css",
			chunkFilename: "[id].[contenthash].css",
		}),
		new SitemapPlugin({
			base: "https://encryptme.net",
			paths: pages.map(
				(page) => ({
					path: `/${page.id}.html`,
					changefreq: page.changefreq,
					priority: page.priority,
				})
			),
			options: {
				lastmod: true,
			},
		})
	].concat(
		pages.map(
			(page) =>
				new HtmlWebpackPlugin({
					inject: "body",
					title: `encryptme: ${page.title}`,
					meta: {
						viewport: "width=device-width, initial-scale=1, shrink-to-fit=no",
						description: page.desc
					},
					filename: `${page.id}.html`,
					template: `./src/pages/${page.id}.html`,
					chunks: [page.id],
				})
		)
	),
	module: {
		rules: [
			{
				test: /\.css$/i,
				use: [MiniCssExtractPlugin.loader, "css-loader"],
			},
		],
	},
};
