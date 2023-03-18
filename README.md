# multiverse-vis

## Installation

To install `multiverse-vis` using `npm` from your local repository you need to call `npm install <path>`.

However, you will need to first ensure that you have a `pkg.main` in the root of the directory. To create one, first make sure that your `rollup.config.js` file is set up as: `output.file: 'pkg.main'` 
Then use: `npm link`


## Development

To contribute to this repository please pick an issue, assign it to yourself and reference it in the branch name. Once you have solved it, please make a pull request and assign @abhsarma to review the code!

To install the library from Github please first ensure that you have `npm` installed.

Then run the following code:

```
git clone https://github.com/abhsarma/multiverse-vis
cd multiverse-vis
npm install
```

To watch for changes and continually rebuild the package (this is useful if you're using npm link to test out changes in a project locally):

```
npm run dev
```


## Sharing

To create a static HTML page of the interactive multiverse visualisation tool, with the assets pre-loaded users can call:

```
npm run compile
```

This will create a `template.html` file, which will work as a standalone HTML document.

## Exporting

Currently, if we make the modifications to package.json so that `pkg.main` is exported instead of the public bundle, we can install the svelte app into a new directory.
The challenge, however, is to take additional command line arguments for the path to the interactive HTML file, the data files and the code files, which are currently hard-coded.

A solution would be to get the files as arguments, move/copy and rename them to the correct relative locations, and then bundle using rollup.

### Troubleshooting

To compile, we make use of the inliner npm library. However, inliner does not support `defer` scripts. So in the `public/index.html` file, move:

```
<head>
    <script defer src="/build/bundle.js"></script>
</head>
```

to **after** the `<body/>` tag:

```
    <body></body>
    <script src="/build/bundle.js"></script>
</html>
```

We use [svelte-template](https://github.com/sveltejs/template) format for creating this project. Svelte template is no longer maintained, but I have had some issues in migrating to vite and Sveltekit. Here, I have outlined some resources for using svelte-template:

- https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Client-side_JavaScript_frameworks/Svelte_getting_started



