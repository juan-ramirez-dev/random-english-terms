use serde::Deserialize;
use serde_json::{Value, json};

#[derive(Deserialize)]
pub struct Pair {
    pub phrase: String,
    pub meaning: String,
}

#[derive(Deserialize)]
pub struct Target {
    pub phrase: String,
    #[serde(rename = "type")]
    pub kind: String,
    pub meaning: String,
    pub example: String,
}

// What the front asks for. Two prompts, one call each.
#[derive(Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum Task {
    Expressions {
        text: String,
    },
    Exercise {
        expression: Target,
        others: Vec<Pair>,
    },
}

// `match` needs three other expressions to pair with.
const MATCH_MIN_OTHERS: usize = 3;

impl Task {
    // Name for the providers' json-schema mode.
    pub fn name(&self) -> &'static str {
        match self {
            Self::Expressions { .. } => "expressions",
            Self::Exercise { .. } => "exercise",
        }
    }

    // Longest answer we wait for. Exercises are short; a text can hold many expressions.
    pub fn max_output_tokens(&self) -> i32 {
        match self {
            Self::Expressions { .. } => 2048,
            Self::Exercise { .. } => 512,
        }
    }

    fn can_match(&self) -> bool {
        match self {
            Self::Exercise { others, .. } => others.len() >= MATCH_MIN_OTHERS,
            Self::Expressions { .. } => false,
        }
    }
}

// Every field required and no nulls: OpenAI strict mode and the local grammar need that.
// "Not used by this kind" = "" or []. The front (parse.ts) validates the rest.
pub fn schema(task: &Task) -> Value {
    match task {
        Task::Expressions { .. } => json!({
            "type": "object",
            "additionalProperties": false,
            "required": ["expressions"],
            "properties": {
                "expressions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": false,
                        "required": ["phrase", "type", "meaning", "example"],
                        "properties": {
                            "phrase": { "type": "string" },
                            "type": {
                                "type": "string",
                                "enum": ["phrasal-verb", "idiom", "collocation", "expression"]
                            },
                            "meaning": { "type": "string" },
                            "example": { "type": "string" }
                        }
                    }
                }
            }
        }),
        Task::Exercise { .. } => {
            let kinds = if task.can_match() {
                json!(["multiple-choice", "fill-gap", "context", "match"])
            } else {
                json!(["multiple-choice", "fill-gap", "context"])
            };
            json!({
                "type": "object",
                "additionalProperties": false,
                "required": ["kind", "sentence", "options", "answer", "pairs"],
                "properties": {
                    "kind": { "type": "string", "enum": kinds },
                    "sentence": { "type": "string" },
                    "options": { "type": "array", "items": { "type": "string" } },
                    "answer": { "type": "string" },
                    "pairs": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": false,
                            "required": ["phrase", "meaning"],
                            "properties": {
                                "phrase": { "type": "string" },
                                "meaning": { "type": "string" }
                            }
                        }
                    }
                }
            })
        }
    }
}

const EXPRESSIONS_RULES: &str = "You help a person learn English from a text they read. Find the expressions in it worth learning.

An expression is a group of words with one meaning:
- \"phrasal-verb\": verb + particle (\"look forward to\").
- \"idiom\": the meaning is not the sum of the words (\"spill the beans\").
- \"collocation\": words that natural speakers put together (\"strong coffee\").
- \"expression\": any other fixed phrase (\"as a matter of fact\").

Rules:
- ONLY expressions that appear in the text. Never add one that is not there.
- Return between 5 and 15, the most useful first. Fewer if the text has fewer. If it has none, return an empty list.
- Never return single plain words, names, or very basic phrases a beginner already knows.
- \"phrase\": the base form, lowercase (\"look forward to\", not \"looking forward to\").
- \"meaning\": one short line in simple English. Don't use the phrase itself in it.
- \"example\": one short, natural sentence that contains \"phrase\" exactly, letter for letter. Take it from the text when the phrase appears there in that form; otherwise write your own.
- Don't repeat an expression.

Example answer for a text that says \"I look forward to the trip, but please don't spill the beans.\":
{\"expressions\":[{\"phrase\":\"look forward to\",\"type\":\"phrasal-verb\",\"meaning\":\"to be happy about something that will happen\",\"example\":\"I look forward to the trip.\"},{\"phrase\":\"spill the beans\",\"type\":\"idiom\",\"meaning\":\"to tell a secret\",\"example\":\"Please don't spill the beans.\"}]}";

const EXERCISE_RULES: &str = "You write one short English exercise to practice one expression.

You get the \"expression\" (with its meaning and an example) and \"others\": other expressions the person is learning. Pick the \"kind\" that suits it best. Always fill all five fields; a field the kind doesn't use is \"\" or [].

1. \"multiple-choice\": the person sees the phrase and picks its meaning.
   - \"options\": 3 meanings. One is the expression's meaning copied exactly; the other two are wrong but believable (you may use meanings from \"others\").
   - \"answer\": the right option, copied exactly.
   - \"sentence\": \"\". \"pairs\": [].
   Example for \"look forward to\": {\"kind\":\"multiple-choice\",\"sentence\":\"\",\"options\":[\"to be happy about something that will happen\",\"to look at something behind you\",\"to tell a secret\"],\"answer\":\"to be happy about something that will happen\",\"pairs\":[]}

2. \"fill-gap\": the person types the missing phrase.
   - \"sentence\": a NEW sentence that uses the phrase, with the phrase replaced by ___ (three underscores, once).
   - \"answer\": the phrase exactly as given.
   - \"options\": []. \"pairs\": [].
   Example: {\"kind\":\"fill-gap\",\"sentence\":\"We really ___ the holidays.\",\"options\":[],\"answer\":\"look forward to\",\"pairs\":[]}

3. \"context\": the person picks the phrase that fits a sentence.
   - \"sentence\": a NEW sentence with ___ where the phrase goes. Only that phrase must fit.
   - \"options\": 3 phrases. One is the expression's phrase; the others come from \"others\".
   - \"answer\": the expression's phrase exactly as given.
   - \"pairs\": [].
   Example: {\"kind\":\"context\",\"sentence\":\"She was so nervous that she let ___ about the party.\",\"options\":[\"spill the beans\",\"look forward to\",\"strong coffee\"],\"answer\":\"spill the beans\",\"pairs\":[]}

4. \"match\": the person pairs phrases with meanings.
   - \"pairs\": the expression plus 3 from \"others\", each phrase with its meaning, copied exactly.
   - \"sentence\": \"\". \"options\": []. \"answer\": \"\".
   Example: {\"kind\":\"match\",\"sentence\":\"\",\"options\":[],\"answer\":\"\",\"pairs\":[{\"phrase\":\"look forward to\",\"meaning\":\"to be happy about something that will happen\"},{\"phrase\":\"spill the beans\",\"meaning\":\"to tell a secret\"}]}

Rules:
- The sentence must make the right answer clear and the wrong ones clearly wrong.
- Simple English. One idea per sentence.
- Only use a kind listed in the schema.";

pub fn system(task: &Task) -> String {
    match task {
        Task::Expressions { .. } => EXPRESSIONS_RULES.to_string(),
        Task::Exercise { .. } => EXERCISE_RULES.to_string(),
    }
}

pub fn user_message(task: &Task) -> String {
    match task {
        Task::Expressions { text } => text.clone(),
        Task::Exercise { expression, others } => json!({
            "expression": {
                "phrase": expression.phrase,
                "type": expression.kind,
                "meaning": expression.meaning,
                "example": expression.example,
            },
            "others": others
                .iter()
                .map(|o| json!({ "phrase": o.phrase, "meaning": o.meaning }))
                .collect::<Vec<_>>(),
        })
        .to_string(),
    }
}

// Whatever a provider returns must be JSON. The front validates the shape.
pub fn parse(raw: &str) -> Option<Value> {
    serde_json::from_str(raw.trim()).ok()
}
