# AI Glossary Helper for Obsidian

An Obsidian plugin that automatically generates definitions for terms using local AI models (via Ollama), creating a personal glossary within your vault.

## Features

- 🤖 **Local AI-powered definitions** - Uses Ollama to generate clear, student-friendly explanations
- 📝 **Simple markup syntax** - Mark terms with `[[¤term]]` to generate glossary entries
- 💾 **Smart caching** - Avoid regenerating definitions for terms you've already looked up
- 🗂️ **Organized notes** - Automatically creates glossary notes in a dedicated folder
- 🏷️ **Auto-tagging** - Applies customizable tags to all glossary entries
- ⚙️ **Flexible configuration** - Choose your AI model and customize behavior

## Demo

Write this in any note:
```markdown
I'm learning [[¤JavaScript]] and [[¤React]] for web development.
```

Run the command **"Process glossary links"**, and the plugin will:
1. Generate definitions using your local Ollama model
2. Create notes at `Glossary/JavaScript.md` and `Glossary/React.md`
3. Replace the markup with standard wiki links: `[[JavaScript]]` and `[[React]]`

## Installation

### Prerequisites

1. **Obsidian** v0.15.0 or higher
2. **Ollama** installed and running locally ([download here](https://ollama.ai))
3. At least one Ollama model downloaded (e.g., `ollama pull gemma2:9b`)



### Basic workflow

1. **Mark terms** in your notes using the special syntax:
   ```markdown
   [[¤JavaScript]]
   ```

2. **Run the command** (Ctrl/Cmd+P):
   - Type "Process glossary links"
   - Or set a custom hotkey in **Settings → Hotkeys**

3. **Review the results**:
   - New glossary notes are created in the `Glossary` folder
   - The markup is replaced with standard wiki links
   - Definitions are cached for future use
