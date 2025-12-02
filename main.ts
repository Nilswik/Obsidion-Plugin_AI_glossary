//Author: NilsWik

/**
 * AI Glossary Helper Plugin for Obsidian
 *
 * Automatically generates definitions for marked terms using local Ollama AI models.
 * Users mark terms with [[¤term]] syntax, and the plugin creates glossary notes with
 * AI-generated definitions.
 * ! USE CAUTION WITH THE AI ANSWERS THEY MIGHT NOT BE CORRECT
 */
import { Plugin, TFile, Notice } from 'obsidian';
import { GlossarySettings, DEFAULT_SETTINGS, GlossarySettingsTab } from './settings';
import { GlossaryCache } from './Cache';
import { generateDefiniton } from './API';

export default class GlossaryPlugin extends Plugin {
	settings: GlossarySettings;
	cache: GlossaryCache;

	/**
	 * Plugin initialization - called when Obsidian loads the plugin.
	 * Sets up settings, cache, commands, and the settings tab.
	 */
	async onload() {
		console.log("AI Glossary plugin loaded");

		// Load user settings from disk, merging with defaults
		await this.loadSettings();

		// Initialize the definition cache system
		this.cache = new GlossaryCache(this.app);
		await this.cache.load();

		// Register the settings tab in Obsidian's settings
		this.addSettingTab(new GlossarySettingsTab(this.app, this));

		// Register the main command for processing glossary terms
		this.addCommand({
			id: "process-glossary-links",
			name: "Process glossary links",
			callback: async () => {
				console.log("Command triggered!");
				await this.processGlossaryTerms();
			}
		});
	}
	//load plugins settings from disk
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	//persist current settings
	async saveSettings() {
		await this.saveData(this.settings);
	}
	//clears the definition cache and shows a confirmation notice
	async clearCache() {
		await this.cache.clear();
		new Notice("Glossary cache cleared");
	}

	/**
	 * Main processing function that finds and processes all glossary term markers
	 *
	 * What it does:
	 * 1. Scans the active file for [[¤TERM]]
	 * 2. it checks if the word is already in the cache, generating a definitions if its needed
	 * 3. it creates a glossary note with formatter and definiton
	 * 4. it will remove the ugly ¤, since it ugly it will change it to -> [[]]
	 */
	async processGlossaryTerms() {
		console.log("processGlossaryTerms started");

		// Get the currently active file in the editor
		const file = this.app.workspace.getActiveFile();
		console.log("Active file:", file?.path);

		if (!file) {
			new Notice("No active file");
			return;
		}

		let content = await this.app.vault.read(file);
		console.log("File content length:", content.length);

		//regex magic that finds ¤ in the term (i hated this)
		const regex = /\[\[¤([^\]]+)\]\]/g;
		const matches = Array.from(content.matchAll(regex));

		console.log("Matches found:", matches.length);

		if (matches.length === 0) {
			new Notice("No glossary terms found (use [[¤term]] format)");
			return;
		}

		new Notice(`Processing ${matches.length} glossary term(s)...`);
		let processedCount = 0;

		//process each matched term
		for (const match of matches) {
			const term = match[1].trim();
			console.log(`Processing term: "${term}"`);
			// prepare a clean wiki link that will replace the one with ¤
			const cleanLink = `[[${term}]]`;
			const folder = this.settings.glossaryFolder;
			const filePath = `${folder}/${term}.md`;

			console.log(`Target path: ${filePath}`);

			try {
				// Create folder if it doesn't exist
				const folderExists = this.app.vault.getAbstractFileByPath(folder);
				if (!folderExists) {
					console.log(`Creating folder: ${folder}`);
					await this.app.vault.createFolder(folder);
					console.log(`Folder created: ${folder}`);
				}

				// Check if note already exists
				let note = this.app.vault.getAbstractFileByPath(filePath);
				console.log(`Note exists: ${note instanceof TFile}`);

				if (!(note instanceof TFile)) {
					// Get or generate definition
					let definition = this.settings.enableCache ? this.cache.get(term) : null;
					console.log(`Cached definition: ${definition ? 'found' : 'not found'}`);

					if (!definition) {
						// No cached definition, generate new one via Ollama
						console.log(`Calling API for: ${term}`);
						new Notice(`Generating definition for: ${term}`);

						definition = await generateDefiniton(term, this.settings.model);
						console.log(`API returned ${definition?.length || 0} characters`);

						// Validate the generated definition
						if (!definition || definition.trim() === "") {
							console.error(`Empty definition returned for: ${term}`);
							new Notice(`Failed to generate definition for: ${term}`);
							continue;
						}

						// Cache the definition if caching is enabled
						if (this.settings.enableCache) {
							this.cache.set(term, definition);
							await this.cache.save();
							console.log(`Cached definition for: ${term}`);
						}
					} else {
						console.log(`Using cached definition (${definition.length} chars)`);
					}

					// Create note with definition
					const tags = this.settings.defaultTags.join(", ");
					const noteContent = `---\ntags: [${tags}]\n---\n\n# ${term}\n\n${definition}\n`;

					console.log(`Creating note at: ${filePath}`);
					console.log(`Note content length: ${noteContent.length} chars`);

					//create a glossary note
					const createdFile = await this.app.vault.create(filePath, noteContent);
					console.log(`Note created successfully:`, createdFile.path);

					new Notice(`Created note: ${term}`);
				} else {
					console.log(`Note already exists, skipping creation`);
				}

				// Replace marker with clean link
				content = content.replace(match[0], cleanLink);
				processedCount++;

			} catch (error) {
				console.error(`Error processing term "${term}":`, error);
				new Notice(`Error processing "${term}": ${error.message}`);
			}
		}

		// Save modified content without ¤
		if (processedCount > 0) {
			console.log(`Saving file with ${processedCount} replacements`);
			await this.app.vault.modify(file, content);
			new Notice(`Successfully processed ${processedCount} glossary term(s)`);
		} else {
			console.log("No terms were processed");
		}
	}
}
