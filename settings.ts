//Author: NilsWik
/**
 *Settings for inside of Obsidion, pick model, change chache and enable if you want cahce
 */

import {App,Plugin,PluginSettingTab,Setting, setTooltip, Value} from "obsidian"

export interface GlossarySettings {
    glossaryFolder: string;
    enableCache: boolean;
    model: string;
    defaultTags: string[];
}

export const DEFAULT_SETTINGS: GlossarySettings = {
    glossaryFolder: "Glossary",
    enableCache: true,
    model: "gemma2:9b",
    defaultTags: ["glossary"]
};

export class GlossarySettingsTab extends PluginSettingTab {
    plugin: any;
    constructor(app: App, plugin:any) {
        super(app,plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;
        containerEl.createEl("h2", {text: "AI Glossary Helper Settings"})
        new Setting(containerEl).setName("Ollama Model").setDesc("model name used for generateing definitions")
        .addText(text => text
            .setPlaceholder("gemma2:9b")
            .setValue(this.plugin.settings.model)
            .onChange(async (Value) => {
                this.plugin.settings.model = Value;
                await this.plugin.saveSettings();
            }));
    new Setting(containerEl)
    .setName("Enable Cache").setDesc("Enable this to avoid re generating exisiting words")
    .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableCache)
        .onChange(async (value) => {
            this.plugin.settings.enableCache = value;
            await this.plugin.saveSettings();
        }));
    new Setting(containerEl)
    .setName("Clear Cache")
    .setDesc("Remove all stored definitions")
    .addButton( button => button.setButtonText("clear").onClick(
        async () =>{
            this.plugin.clearCache();}));
    }
}
