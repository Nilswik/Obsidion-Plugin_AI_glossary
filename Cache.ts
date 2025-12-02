//Author: NilsWik

/**
 * Manages persistent caching of generated glossary definitions.
 *
 * The cache is stored as a JSON file in the vault root to avoid regenerating
 * definitions for terms that have already been processed. This improves performance
 * and reduces API calls to Ollama.
 * So if "Javascript is already defined it will skip not generate a glossary item for that term.
 * */
import { App, TFile } from "obsidian";

export class GlossaryCache {
    /** Name of the cache file stored in the vault root */

    private cacheFileName = "ai-glossary-cache.json";
    /** Reference to the Obsidian app instance */

    private app: App;
    /** In-memory cache of term-to-definition mappings */

    private cache: Record<string, string> = {};

    /**
     * Creates a new GlossaryCache instance.
     *
     * @param app - The Obsidian app instance for vault access
     */
    constructor(app: App) {
        this.app = app;
    }
    /**Load the cache from disk into memory
     * if the cahce dosen't exist or is invalid a new one will be created
     * It will be created on first save when using command in Obsidion
     */
    async load() {
        const file = this.app.vault.getAbstractFileByPath(this.cacheFileName);
        if (file instanceof TFile) {
            try {
                const data = await this.app.vault.read(file);
                this.cache = JSON.parse(data);
            } catch (error) {
                console.error("Failed to load cache:", error);
                this.cache = {};
            }
        }
    }

    /**
    * Persists the in-memory cache to disk.
    *
    * Creates the cache file if it doesn't exist, or updates it if it does.
    */

    async save() {
        try {
            const existingFile = this.app.vault.getAbstractFileByPath(this.cacheFileName);

            if (existingFile instanceof TFile) {
                await this.app.vault.modify(existingFile, JSON.stringify(this.cache, null, 2));
            } else {
                await this.app.vault.create(this.cacheFileName, JSON.stringify(this.cache, null, 2));
            }
        } catch (error) {
            console.error("Failed to save cache:", error);
        }
    }
    //Retrieves a cached definition for a term.
    get(term: string): string | null {
        return this.cache[term] ?? null;
    }
    //stores a definition for a term in the cache.
    set(term: string, definition: string): void {
        this.cache[term] = definition;
    }
    //will clear the cache
    async clear() {
        this.cache = {};
        await this.save();
    }
}

