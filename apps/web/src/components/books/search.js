import {publicationTypeLabels} from "@/spaces/spaces.mock.js";

const normalize = value => String(value ?? "").trim().toLocaleLowerCase("ru").replaceAll("ё", "е");
export function searchBooks(books, query) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return books.filter(book => {
    const text = normalize([book.title, book.subtitle, book.author, book.body, publicationTypeLabels[book.type], book.reader.language, book.reader.format].join(" "));
    return words.every(word => text.includes(word));
  }).sort((a, b) => Number(normalize(b.title).includes(normalize(query))) - Number(normalize(a.title).includes(normalize(query))));
}
