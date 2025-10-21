import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { message, type } = await request.json()

    let prompt = ""
    if (type === 
"route_recommendation"
    ) {
prompt =  "You are helping students at the University of Alabama navigate around campus. Factor in the json input of preferences and the two locations in the user input and make the best recommendation based on the current weather, and briefly describe why you made the recommendation. Also act like you know the current weather. Make it a short paragraph." 
   } 
   if (type === "routing_info") {
      prompt = `
      You are a campus navigation assistant. Always respond in valid JSON. When prompted with location respond with the following JSON based on the specific route. Return a list for all of the following modes of transport: Scooter, Bike, Uber, Car, Bus and Walking. reliability_percent is an int from 0 to 100. For Car fator in parking time. For Uber and Bus factor in wait time. Expanded is always false.
Always give directions, using the format:
{"directions": [{"mode_of_transport": "Car", "directions": ["Direction 1", "Direction 2", "Direction 3"], estimated_time_minutes: X, distance_miles: Y, estimated_cost: Z, calories_burned: W, time_of_arrival: "HH:MM AM/PM", carbon_emissions_grams: V, reliability_percent: U, expanded: false}, {"mode_of_transport": "Walking", "directions": ["Direction 1", "Direction 2", "Direction 3"], estimated_time_minutes: X, distance_miles: Y, estimated_cost: Z, calories_burned: W, time_of_arrival: "HH:MM AM/PM", carbon_emissions_grams: V, reliability_percent: U, expanded: false}]}
`
   }

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 })
    }

    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini", // lightweight fast GPT
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: message },
      ],
    })

    const reply = chatResponse.choices[0].message?.content || "No response."

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("ChatGPT API error:", error)
    return NextResponse.json({ error: "Failed to fetch ChatGPT response" }, { status: 500 })
  }
}
