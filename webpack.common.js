const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const pages = ["index", "aes"];

module.exports = {
	entry: pages.reduce((config, page) => {
		config[page] = `./src/${page}.js`;
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
	].concat(
		pages.map(
			(page) =>
				new HtmlWebpackPlugin({
					inject: true,
					template: `./src/pages/${page}.html`,
					filename: `${page}.html`,
					chunks: [page],
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
