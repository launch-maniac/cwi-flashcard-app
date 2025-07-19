exports.handler = async function (event, context) {
  // This securely gets the API key you set in the Netlify dashboard.
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API key is not set. Please check your Netlify environment variables." })
    };
  }

  const prompt = `
      Act as an expert CWI exam preparation instructor. Create a set of 15 flashcards to help a student prepare for the AWS CWI Part C exam using the AWS D15.1 Railroad Welding Specification.
      The goal is to test the student's ability to quickly locate information in the codebook.
      Therefore, each 'question' should ask WHERE to find a specific piece of information.
      Each 'answer' should be the specific Clause number and title where the information is located.
      Example Question: "Where in the code would you find the requirements for welder performance qualification?"
      Example Answer: "Clause 8: Qualification"
      Focus on the most critical and frequently tested areas: Qualification, Fabrication, and Inspection.
      Provide the output as a JSON array where each object has a "question" and "answer" key.
  `;

  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            "question": { "type": "STRING" },
            "answer": { "type": "STRING" }
          },
          required: ["question", "answer"]
        }
      }
    }
  };

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("API Error:", errorBody);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `API request failed with status ${response.status}` })
      };
    }

    const result = await response.json();
    
    if (!result.candidates || !result.candidates[0].content) {
        console.error("Invalid API Response Structure:", result);
        throw new Error("Invalid response structure from API.");
    }

    const jsonText = result.candidates[0].content.parts[0].text;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: jsonText
    };

  } catch (error) {
    console.error("Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
