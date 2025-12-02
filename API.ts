//Author: NilsWik

/**
 *
 * This function makes a request to a locally running Ollama instance and streams
 * the response to build a complete definition. The definition is tailored to be
 * clear and concise for student learning.
 *
 * @param term - The term or concept to define (e.g., "JavaScript", "recursion")
 * @param model - The Ollama model to use (e.g., "gemma2:9b", "llama2", "mistral")
 * @returns A promise that resolves to the generated definition as a string
 * @throws Error if Ollama is Off, if the model doesn't exist, or the response is empty
 */
export async function generateDefiniton(term: string, model: string): Promise<string> {
    try {
        // Make HTTP POST request to local Ollama API
        // Ollama must be running on localhost:11434 for this to work
        const response = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: model,
                // Prompt instructs the AI to provide student-friendly definitions
                //TODO: IDK this can be better but I cant come up with a better prompt for now
                prompt: `Define this term clearly and briefly for a student:\n\n${term}`,
                // Stream mode allows us to receive the response incrementally
                stream: true
            })
        });
        // Check if the request was successful
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Ollama API error (${response.status}):`, errorText);
            throw new Error(`Ollama API returned ${response.status}. Is Ollama running? Is the model "${model}" installed?`);
        }
        // Verify response body exists before attempting to read
        if (!response.body) {
            throw new Error("Response body is null");
        }
        // Set up streaming reader to process response chunks
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        // Read all chunks from the stream and accumulate them
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            // Decode binary data to text and append to buffer
            buffer += decoder.decode(value, { stream: true });
        }
        // Parse the streamed response
        // Ollama sends newline-delimited JSON objects, each containing a "response" field
        let output = "";
        for (const line of buffer.split("\n")) {

            // if the line is empty then skip it
            if (!line.trim()) continue;

            //each line is a JSON object
            try {
                const json = JSON.parse(line);
                output += json.response ?? "";
            } catch (e) {
                console.warn("Failed to parse line:", line);
            }
        }

        const result = output.trim();
        if (!result) {
            throw new Error("Empty response from Ollama");
        }

        return result;

    } catch (error) {
        console.error("Error generating definition:", error);
        // error for debug if the server is not on
        if (error instanceof TypeError && error.message.includes("fetch")) {
            throw new Error("Cannot connect to Ollama at localhost:11434. Please ensure Ollama is running.");
        }

        throw error;
    }
}
