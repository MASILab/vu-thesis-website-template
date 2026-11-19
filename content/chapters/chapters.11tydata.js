// Chapter defaults. A JS data file because chapters skip template pre-processing
// (so "{{ }}" permalinks wouldn't render). 01-introduction.md -> /introduction/
export default {
	layout: "layouts/chapter.njk",
	permalink: (data) => `/${data.page.fileSlug.replace(/^\d+-/, "")}/`,
};
