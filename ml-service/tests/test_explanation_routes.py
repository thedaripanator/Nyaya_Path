import json
import unittest

from app.routes.explanation_routes import (
    build_retry_payload,
    extract_completion,
    parse_explanation,
)


class ExplanationResponseParsingTests(unittest.TestCase):
    def test_extracts_valid_completion_and_parses_required_fields(self):
        explanation = {
            "simple_explanation": "A simple explanation.",
            "technical_terms_explained": "A term means this.",
            "why_this_law_matters": "It matters in this situation.",
            "real_life_example": "For example, a person may...",
            "conditions_and_exceptions": "This applies when...",
            "punishment_or_legal_consequence": "No punishment is specified here."
        }
        content = json.dumps(explanation)

        extracted, finish_reason = extract_completion({
            "choices": [{
                "message": {"content": content},
                "finish_reason": "stop"
            }]
        })

        self.assertEqual(finish_reason, "stop")
        self.assertEqual(parse_explanation(extracted), explanation)

    def test_rejects_completion_without_json(self):
        with self.assertRaisesRegex(ValueError, "valid JSON object"):
            parse_explanation("I cannot provide a JSON response.")

    def test_rejects_missing_completion_content(self):
        with self.assertRaisesRegex(ValueError, "empty explanation content"):
            extract_completion({
                "choices": [{
                    "message": {"content": None},
                    "finish_reason": "stop"
                }]
            })

    def test_retry_preserves_model_generation_options(self):
        payload = {
            "model": "configured-model",
            "temperature": 0.1,
            "max_tokens": 1200,
            "response_format": {"type": "json_object"},
            "messages": []
        }

        retry = build_retry_payload(payload, "Explain this provision.")

        self.assertEqual(retry["model"], payload["model"])
        self.assertEqual(retry["temperature"], payload["temperature"])
        self.assertEqual(retry["max_tokens"], payload["max_tokens"])
        self.assertEqual(retry["response_format"], payload["response_format"])
        self.assertIn("/no_think", retry["messages"][-1]["content"])


if __name__ == "__main__":
    unittest.main()
