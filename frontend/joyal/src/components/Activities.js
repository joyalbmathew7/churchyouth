const imageFiles = import.meta.glob(
    "../assets/activities/*/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG}",
    { eager: true, query: "?url", import: "default" }
);

const infoFiles = import.meta.glob("../assets/activities/*/info.json", {
    eager: true,
    import: "default",
});

const prettify = (text) =>
    text.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const folders = {};
for (const [path, url] of Object.entries(imageFiles)) {
    const parts = path.split("/");
    const folder = parts[parts.length - 2];
    const file = parts[parts.length - 1];
    (folders[folder] ||= []).push({ file, url });
}

const activities = Object.entries(folders)
    .map(([folder, files]) => {
        files.sort((a, b) =>
            a.file.localeCompare(b.file, undefined, { numeric: true })
        );
        const info = infoFiles[`../assets/activities/${folder}/info.json`] || {};
        const coverFile = files.find((f) => f.file === "IMG-20261019-WA0013.jpg") || files[0];

        return {
            id: folder,
            title: info.title || prettify(folder),
            date: info.date || "",
            sortDate: info.sortDate || "",
            location: info.location || "",
            summary: info.summary || "",
            description: info.description || "",
            cover: coverFile.url,
            images: files.map((f) => f.url),
        };
    })
    .sort((a, b) => b.sortDate.localeCompare(a.sortDate));

export default activities;