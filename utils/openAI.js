import { ChatOpenAI } from "@langchain/openai";

class OpenAI {


    constructor(temperature = 0) {
        this.model = new ChatOpenAI({
            model: process.env.OPENAI_MODEL,
            apiKey: process.env.OPENAI_API_KEY,
            temperature: temperature,
        });
    }

    // async invoke(messages) {
    //     return await this.model.invoke(messages);
    // }

}

export default OpenAI