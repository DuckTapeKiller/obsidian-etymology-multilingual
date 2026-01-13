import { App, Modal, Plugin, requestUrl } from "obsidian";
import { Etymo } from "./lib/etymo-js";
import { displayEntries } from "./util/displayEntries";
import { ellipsis } from "./util/ellipsis";

const etymo = new Etymo();

class LanguagePromptModal extends Modal {
  selection: string | undefined;
  onSubmit: (lang: "en" | "es" | "fr") => void;

  constructor(app: App, selection: string | undefined, onSubmit: (lang: "en" | "es" | "fr") => void) {
    super(app);
    this.selection = selection;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const contentEl = this.contentEl;
    contentEl.addClass("etymol-language-prompt");
    contentEl.createEl("h2", { text: "Select Language" });
    contentEl.createEl("p", { text: "Search etymology / Buscar etimología / Rechercher l'étymologie" });

    const buttonContainer = contentEl.createDiv({ cls: "etymol-button-container" });

    const englishButton = buttonContainer.createEl("button", { text: "English" });
    englishButton.style.marginRight = "12px";
    englishButton.addEventListener("click", () => {
      this.onSubmit("en");
      this.close();
    });

    const spanishButton = buttonContainer.createEl("button", { text: "Español" });
    spanishButton.style.marginRight = "12px";
    spanishButton.addEventListener("click", () => {
      this.onSubmit("es");
      this.close();
    });

    const frenchButton = buttonContainer.createEl("button", { text: "Français" });
    frenchButton.addEventListener("click", () => {
      this.onSubmit("fr");
      this.close();
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}

class EtymologyLookupModal extends Modal {
  data: string | undefined;
  lang: "en" | "es" | "fr";

  constructor(app: App, data: string | undefined, lang: "en" | "es" | "fr") {
    super(app);
    this.data = data;
    this.lang = lang;
  }

  async onOpen() {
    const contentEl = this.contentEl;
    contentEl.setText("Searching...");
    contentEl.className = "etymol-modal-content";

    if (!this.data) {
      contentEl.setText("");
      return;
    }

    try {
      const searchTerm = this.data.trim().toLowerCase();

      if (this.lang === "en") {
        const entries = await etymo.search(searchTerm);
        displayEntries(entries, contentEl, searchTerm);
      } else if (this.lang === "es") {
        const [etymDPD, etymDLE, etymDeChile] = await Promise.all([
          fetchSpanishEtymologyDPD(searchTerm),
          fetchSpanishEtymologyDLE(searchTerm),
          fetchSpanishEtymologyDeChile(searchTerm),
        ]);

        contentEl.empty();
        const wordEl = contentEl.createEl("h2", { text: searchTerm });
        wordEl.style.marginBottom = "1em";

        const dpdHeader = contentEl.createEl("h3", { text: "Fuente: DPD (RAE)" });
        const dpdText = contentEl.createEl("div");
        dpdText.style.whiteSpace = "pre-wrap";
        dpdText.setText(etymDPD ?? "No se ha encontrado la etimología.");

        const dleHeader = contentEl.createEl("h3", { text: "Fuente: DLE (RAE)" });
        const dleText = contentEl.createEl("div");
        dleText.style.whiteSpace = "pre-wrap";
        dleText.setText(etymDLE ?? "No se ha encontrado la etimología.");

        const deChileHeader = contentEl.createEl("h3", { text: "Fuente: Diccionario Etimológico de Chile" });
        const deChileText = contentEl.createEl("div");
        deChileText.style.whiteSpace = "pre-wrap";
        deChileText.setText(etymDeChile ?? "No se ha encontrado la etimología.");
      } else if (this.lang === "fr") {
        const [etymWiktionary, etymCNRTL] = await Promise.all([
          fetchFrenchEtymologyWiktionary(searchTerm),
          fetchFrenchEtymologyCNRTL(searchTerm),
        ]);

        contentEl.empty();
        const wordEl = contentEl.createEl("h2", { text: searchTerm });
        wordEl.style.marginBottom = "1em";

        const wiktionaryHeader = contentEl.createEl("h3", { text: "Source: Wiktionnaire" });
        const wiktionaryText = contentEl.createEl("div");
        wiktionaryText.style.whiteSpace = "pre-wrap";
        wiktionaryText.setText(etymWiktionary ?? "Aucune étymologie trouvée.");

        const cnrtlHeader = contentEl.createEl("h3", { text: "Source: CNRTL" });
        const cnrtlText = contentEl.createEl("div");
        cnrtlText.style.whiteSpace = "pre-wrap";
        cnrtlText.setText(etymCNRTL ?? "Aucune étymologie trouvée.");
      }
    } catch (error) {
      contentEl.setText("Search failed. Are you connected to the internet?");
      console.error("Etymology lookup error:", error);
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}

async function fetchSpanishEtymologyDPD(word: string): Promise<string | null> {
  try {
    const url = `https://www.rae.es/dpd/${encodeURIComponent(word)}`;
    const response = await requestUrl({ url });
    if (response.status !== 200) return null;

    const parser = new DOMParser();
    const doc = parser.parseFromString(response.text, "text/html");

    const sections = Array.from(doc.querySelectorAll("section"));
    for (const section of sections) {
      const header = section.querySelector("h2");
      if (header && header.textContent?.trim().toLowerCase() === "etimología") {
        const etimologyText = section.textContent?.replace(/^etimología\s*/i, "").trim();
        if (etimologyText) return etimologyText;
      }
    }

    const firstSenseP = doc.querySelector("p[data-heading='sense']");
    if (firstSenseP) {
      const text = firstSenseP.textContent?.trim();
      if (text) return text;
    }

    return null;
  } catch (error) {
    console.error("Error fetching Spanish etymology from DPD:", error);
    return null;
  }
}

async function fetchSpanishEtymologyDLE(word: string): Promise<string | null> {
  try {
    const url = `https://dle.rae.es/${encodeURIComponent(word)}`;
    const response = await requestUrl({ url });
    if (response.status !== 200) return null;

    const parser = new DOMParser();
    const doc = parser.parseFromString(response.text, "text/html");

    const section = doc.querySelector("section.c-section");
    if (section) {
      const etimDiv = section.querySelector("div.n2.c-text-intro");
      if (etimDiv) {
        return etimDiv.textContent?.trim() || null;
      }
    }
    return null;
  } catch (error) {
    console.error("Error fetching Spanish etymology from DLE:", error);
    return null;
  }
}

async function fetchSpanishEtymologyDeChile(word: string): Promise<string | null> {
  try {
    const url = `https://etimologias.dechile.net/?${encodeURIComponent(word)}`;
    const response = await requestUrl({ url });
    if (response.status !== 200) return null;

    const buffer = response.arrayBuffer;
    const text = new TextDecoder("latin1").decode(new Uint8Array(buffer));

    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

    const h3Elements = Array.from(doc.querySelectorAll("h3"));
    let targetH3: Element | null = null;

    for (const h3 of h3Elements) {
      if (h3.textContent?.trim().toLowerCase() === word.toLowerCase()) {
        targetH3 = h3;
        break;
      }
    }

    if (!targetH3) return null;

    const etymologyTexts: string[] = [];
    let sibling = targetH3.nextElementSibling;

    while (sibling && sibling.tagName.toLowerCase() === "p") {
      const text = sibling.textContent?.trim();
      if (text) etymologyTexts.push(cleanText(normalizeText(text)));
      sibling = sibling.nextElementSibling;
    }

    if (etymologyTexts.length === 0) return null;

    return etymologyTexts.join("\n\n");
  } catch (error) {
    console.error("Error fetching Spanish etymology from DeChile:", error);
    return null;
  }
}

async function fetchFrenchEtymologyWiktionary(word: string): Promise<string | null> {
  try {
    const url = `https://fr.wiktionary.org/wiki/${encodeURIComponent(word)}`;
    const response = await requestUrl({ url });
    if (response.status !== 200) return null;

    const parser = new DOMParser();
    const doc = parser.parseFromString(response.text, "text/html");

    const etymologySection = doc.querySelector("#Étymologie, #Etymologie");
    if (!etymologySection) return null;

    let etymologyText = "";
    let nextElement = etymologySection.nextElementSibling;

    while (nextElement && !["h2", "h3"].includes(nextElement.tagName.toLowerCase())) {
      const text = nextElement.textContent?.trim();
      if (text) etymologyText += text + "\n";
      nextElement = nextElement.nextElementSibling;
    }

    return cleanText(normalizeText(etymologyText)) || null;
  } catch (error) {
    console.error("Error fetching French etymology from Wiktionnaire:", error);
    return null;
  }
}

async function fetchFrenchEtymologyCNRTL(word: string): Promise<string | null> {
  try {
    const url = `https://www.cnrtl.fr/etymologie/${encodeURIComponent(word)}`;
    const response = await requestUrl({ url });
    if (response.status !== 200) return null;

    const parser = new DOMParser();
    const doc = parser.parseFromString(response.text, "text/html");

    const etymologyDiv = doc.querySelector("div.tlf_cvedette + b");
    if (!etymologyDiv) return null;

    let etymologyText = "";
    let currentElement: HTMLElement | null = etymologyDiv.parentElement as HTMLElement;

    while (currentElement && currentElement.id !== "contentbox") {
      const text = currentElement.textContent?.trim();
      if (text) etymologyText += text + "\n";
      currentElement = currentElement.nextElementSibling as HTMLElement | null;
    }

    return cleanText(normalizeText(etymologyText)) || null;
  } catch (error) {
    console.error("Error fetching French etymology from CNRTL:", error);
    return null;
  }
}

function normalizeText(text: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  let normalized = textarea.value;

  normalized = normalized
    .replace(/Ã¡/g, "á")
    .replace(/Ã©/g, "é")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ãº/g, "ú")
    .replace(/Ãñ/g, "ñ")
    .replace(/Ã/g, "Á")
    .replace(/Ã‰/g, "É")
    .replace(/Ã/g, "Í")
    .replace(/Ã“/g, "Ó")
    .replace(/Ãš/g, "Ú")
    .replace(/Ã‘/g, "Ñ")
    .replace(/Ã¢/g, "â")
    .replace(/Ãè/g, "è")
    .replace(/Ãê/g, "ê")
    .replace(/Ãî/g, "î")
    .replace(/Ãô/g, "ô")
    .replace(/Ã»/g, "û")
    .replace(/Ã§/g, "ç")
    .replace(/Ã€/g, "À")
    .replace(/Ã‚/g, "Â")
    .replace(/Ãˆ/g, "È")
    .replace(/ÃŠ/g, "Ê")
    .replace(/ÃŽ/g, "Î")
    .replace(/Ã”/g, "Ô")
    .replace(/Ã›/g, "Û")
    .replace(/Ã‡/g, "Ç");

  return normalized;
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/(\r?\n){2,}/g, "\n\n")
    .trim();
}

export default class EtymologyLookupPlugin extends Plugin {
  async onload() {
    // Add ribbon icon for etymology lookup
    this.addRibbonIcon("sprout", "Etymology Lookup", () => {
      const selection = getCurrentSelectedText(this.app);
      this.promptAndLookup(selection);
    });

    // Add command for etymology search
    this.addCommand({
      id: "search",
      name: "Search Etymology",
      callback: () => {
        const selection = getCurrentSelectedText(this.app);
        this.promptAndLookup(selection);
      },
    });

    // Register context menu event
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor) => {
        const selection = editor.getSelection();
        if (selection) {
          menu.addItem((item) => {
            item.setTitle(`Get etymology of "${ellipsis(selection, 18)}"`).onClick(() => {
              this.promptAndLookup(selection);
            });
          });
        }
      })
    );
  }

  onunload() {
    // Cleanup if needed
  }

  async promptAndLookup(selection: string | undefined) {
    if (!selection) return;
    new LanguagePromptModal(this.app, selection, (lang: "en" | "es" | "fr") => {
      const modal = new EtymologyLookupModal(this.app, selection, lang);
      modal.open();
    }).open();
  }
}

function getCurrentSelectedText(app: App): string {
  const editor = app.workspace.activeEditor?.editor;
  if (editor) {
    const selection = editor.getSelection();
    if (typeof selection === "string" && selection.trim()) {
      return selection.trim();
    }
  }
  const selection = document.getSelection()?.toString();
  return (selection && selection.trim()) || "";
}
