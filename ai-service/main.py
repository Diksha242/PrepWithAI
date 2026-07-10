import uvicorn
import os
import json


from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Optional

from groq import Groq

# ============================================================
# ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()

AI_SERVICE_PORT = int(
    os.getenv("AI_SERVICE_PORT", 8000)
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

GROQ_LLM_MODEL = os.getenv(
    "GROQ_LLM_MODEL",
    "llama-3.1-8b-instant"
)

GROQ_WHISPER_MODEL = os.getenv(
    "GROQ_WHISPER_MODEL",
    "whisper-large-v3-turbo"
)

if not GROQ_API_KEY:
    raise RuntimeError(
        "GROQ_API_KEY is missing from ai-service/.env"
    )

client = Groq(
    api_key=GROQ_API_KEY
)


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="AI Interviewer Microservice",
    version="2.0"
)


# ============================================================
# CORS
# ============================================================

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# PYDANTIC MODELS
# ============================================================

class QuestionRequest(BaseModel):
    practice_mode: str = "role-based"
    role: str = "MERN Stack Developer"
    topic: Optional[str] = None
    level: str = "Junior"
    count: int = 5
    interview_type: str = "coding-mix"


class QuestionResponse(BaseModel):
    questions: list[str]
    model_used: str


class EvaluationRequest(BaseModel):
    question: str
    question_type: str
    role: str
    level: str
    user_answer: Optional[str] = None
    user_code: Optional[str] = None


class EvaluationResponse(BaseModel):
    technicalScore: int
    confidenceScore: int
    aiFeedback: str
    idealAnswer: str


# ============================================================
# ROOT ROUTE
# ============================================================

@app.get("/")
async def root():
    return {
        "message": "Hello from AI Interviewer Microservice!",
        "provider": "Groq",
        "llm_model": GROQ_LLM_MODEL,
        "whisper_model": GROQ_WHISPER_MODEL
    }

# ============================================================
# GENERATE QUESTIONS
# ============================================================

@app.post(
    "/generate-questions",
    response_model=QuestionResponse
)
async def generate_questions(request: QuestionRequest):

    try:

        # ----------------------------------------------------
        # VALIDATION
        # ----------------------------------------------------

        valid_modes = [
            "role-based",
            "sde-mixed",
            "dsa",
            "core-subjects"
        ]

        if request.practice_mode not in valid_modes:

            raise HTTPException(
                status_code=400,
                detail=f"Invalid practice mode: {request.practice_mode}"
            )


        if request.count <= 0:

            raise HTTPException(
                status_code=400,
                detail="Question count must be greater than zero."
            )


        # ----------------------------------------------------
        # QUESTION TYPE INSTRUCTION
        # ----------------------------------------------------

        if request.interview_type == "coding-mix":

            coding_count = max(
                1,
                int(request.count * 0.2)
            )

            oral_count = request.count - coding_count

            format_instruction = (
                f"The first {coding_count} questions MUST be coding "
                f"challenges requiring problem solving or function "
                f"implementation. "
                f"The remaining {oral_count} questions MUST be "
                f"conceptual oral questions."
            )

        else:

            format_instruction = (
                "All questions MUST be conceptual oral questions. "
                "Do not generate coding or implementation challenges."
            )


        # ----------------------------------------------------
        # PRACTICE MODE LOGIC
        # ----------------------------------------------------

        if request.practice_mode == "role-based":

            mode_instruction = (
                f"Generate questions specifically for a "
                f"{request.level} level {request.role} technical interview. "
                f"Focus on technologies, architecture, debugging, "
                f"practical development, best practices, performance, "
                f"security, and real-world scenarios relevant to this role."
            )


        elif request.practice_mode == "sde-mixed":

            mode_instruction = (
                f"Generate a balanced {request.level} level "
                f"Software Development Engineer interview. "
                f"Include questions from the following areas: "
                f"Data Structures and Algorithms, "
                f"DBMS, Operating Systems, Computer Networks, OOP, "
                f"software development concepts, debugging, "
                f"project discussion, system thinking, "
                f"and behavioral engineering scenarios. "
                f"Keep the interview balanced across these areas."
            )


        elif request.practice_mode == "dsa":

            topic = request.topic or "Mixed DSA"

            mode_instruction = (
                f"Generate {request.level} level Data Structures "
                f"and Algorithms interview questions focused on {topic}. "
                f"Questions should test problem-solving ability, "
                f"time and space complexity analysis, "
                f"algorithm selection, edge cases, optimization, "
                f"and implementation ability."
            )


        elif request.practice_mode == "core-subjects":

            topic = request.topic or "Mixed Core CS"

            mode_instruction = (
                f"Generate {request.level} level technical interview "
                f"questions focused on the core computer science "
                f"subject: {topic}. "
                f"Test conceptual understanding, practical scenarios, "
                f"trade-offs, debugging knowledge, and "
                f"interview-relevant fundamentals."
            )


        # ----------------------------------------------------
        # SYSTEM PROMPT
        # ----------------------------------------------------

        system_prompt = (
            "You are a professional technical interviewer. "

            "Generate high-quality technical interview questions "
            "appropriate for the requested difficulty level. "

            f"{mode_instruction} "

            f"{format_instruction} "

            "Important rules: "

            "Generate exactly the requested number of questions. "

            "Do not include answers. "

            "Do not include explanations. "

            "Do not include hints. "

            "Do not include introductory text. "

            "Do not include conversational text. "

            "Do not number the questions. "

            "Output exactly one complete question per line."
        )


        # ----------------------------------------------------
        # USER PROMPT
        # ----------------------------------------------------

        user_prompt = (
            f"Generate exactly {request.count} unique interview questions.\n"
            f"Practice Mode: {request.practice_mode}\n"
            f"Role: {request.role}\n"
            f"Topic: {request.topic or 'Not specified'}\n"
            f"Level: {request.level}\n"
            f"Interview Type: {request.interview_type}\n"
        )


        # ----------------------------------------------------
        # CALL GROQ
        # ----------------------------------------------------

        response = client.chat.completions.create(
            model=GROQ_LLM_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ],
             temperature=0.6,            
        )


        # ----------------------------------------------------
        # PROCESS RESPONSE
        # ----------------------------------------------------

        raw_text = response.choices[0].message.content.strip()

        questions = [
            question.strip()
            for question in raw_text.split("\n")
            if question.strip()
        ]


        # Remove accidental numbering from AI response

        cleaned_questions = []

        for question in questions:

            cleaned_question = question

            if ". " in question:

                first_part = question.split(". ", 1)[0]

                if first_part.isdigit():

                    cleaned_question = question.split(". ", 1)[1]


            cleaned_questions.append(cleaned_question)


        return QuestionResponse(
            questions=cleaned_questions[:request.count],
            model_used=GROQ_LLM_MODEL
        )


    except HTTPException:

        raise


    except Exception as e:

        print(f"Question generation failed: {e}")

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# TRANSCRIBE AUDIO
# ============================================================

@app.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...)
):
    try:
        audio_bytes = await file.read()

        if not audio_bytes:
            raise HTTPException(
                status_code=400,
                detail="Uploaded audio file is empty."
            )

        transcription = client.audio.transcriptions.create(
            file=(
                file.filename or "recording.webm",
                audio_bytes
            ),
            model=GROQ_WHISPER_MODEL,
            response_format="json",
            language="en"
        )

        return {
            "transcription": transcription.text.strip()
        }

    except HTTPException:
        raise

    except Exception as e:
        print(f"Transcription failed: {e}")

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# EVALUATE ANSWER
# ============================================================

@app.post(
    "/evaluate",
    response_model=EvaluationResponse
)
async def evaluate(request: EvaluationRequest):

    try:

        # ----------------------------------------------------
        # QUESTION TYPE ASSESSMENT
        # ----------------------------------------------------

        if request.question_type == "oral":

            assessment_instruction = (
                "This is a conceptual oral question. "
                "Focus purely on the candidate's verbal explanation. "
                "Ignore code blocks. "

                "CRITICAL: If the transcript is empty, nonsense, "
                "gibberish, testing text, or irrelevant to the "
                "question, give technicalScore 0 and confidenceScore 0."
            )


        else:

            assessment_instruction = (
                "This is a coding challenge question. "

                "Evaluate the code for correctness, logic, "
                "time complexity, space complexity, edge cases, "
                "and code quality. "

                "Use the verbal transcription only for insight "
                "into the candidate's thought process. "

                "CRITICAL: If the code is undefined, empty, "
                "random comments, or random characters, "
                "give technicalScore 0 and confidenceScore 0."
            )


        # ----------------------------------------------------
        # SYSTEM PROMPT
        # ----------------------------------------------------

        system_prompt = (
            "You are a strict technical interviewer. "

            "Evaluate the candidate objectively. "

            "Do not hallucinate positive feedback for bad input. "

            "RULE 1: If the answer is gibberish, irrelevant, "
            "or missing, return technicalScore 0 and "
            "confidenceScore 0. "

            "RULE 2: technicalScore and confidenceScore "
            "must be integers between 0 and 100. "

            "RULE 3: aiFeedback must clearly explain strengths, "
            "mistakes, and improvements. "

            "RULE 4: idealAnswer must contain a clean Markdown "
            "string and must not be a nested JSON object. "

            f"Assessment Context: {assessment_instruction} "

            "Respond ONLY with a JSON object. "

            "Required keys: "
            "'technicalScore', "
            "'confidenceScore', "
            "'aiFeedback', "
            "'idealAnswer'."
        )


        # ----------------------------------------------------
        # USER PROMPT
        # ----------------------------------------------------

        user_prompt = (

            f"Role: {request.role}\n"

            f"Question: {request.question}\n"

            f"Level: {request.level}\n"

            f"Question Type: {request.question_type}\n"

            f"Verbal Answer: "
            f"{request.user_answer or 'No verbal answer provided'}\n"

            f"Code Answer: "
            f"{request.user_code or 'No code provided'}\n"
        )


        # ----------------------------------------------------
        # CALL Groq
        # ----------------------------------------------------

        response = client.chat.completions.create(
            model=GROQ_LLM_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ],
             temperature=0.1,
             response_format={
                 "type": "json_object"
             }
        )


        response_text = response.choices[0].message.content.strip()


        # ----------------------------------------------------
        # PARSE JSON
        # ----------------------------------------------------

        try:

            evaluation_data = json.loads(
                response_text
            )


            if (
                "idealAnswer" in evaluation_data
                and not isinstance(
                    evaluation_data["idealAnswer"],
                    str
                )
            ):

                evaluation_data["idealAnswer"] = json.dumps(
                    evaluation_data["idealAnswer"]
                )


            return EvaluationResponse(
                **evaluation_data
            )


        except json.JSONDecodeError:

            import re

            fixed_text = re.sub(
                r"[\r\n\t]",
                " ",
                response_text
            )


            try:

                evaluation_data = json.loads(
                    fixed_text
                )


                if (
                    "idealAnswer" in evaluation_data
                    and not isinstance(
                        evaluation_data["idealAnswer"],
                        str
                    )
                ):

                    evaluation_data["idealAnswer"] = json.dumps(
                        evaluation_data["idealAnswer"]
                    )


                return EvaluationResponse(
                    **evaluation_data
                )


            except Exception:

                print(
                    f"Failed to parse response: "
                    f"{response_text}"
                )


                return EvaluationResponse(
                    technicalScore=0,
                    confidenceScore=0,
                    aiFeedback=(
                        "The AI evaluation response could not be parsed."
                    ),
                    idealAnswer=(
                        "The ideal answer could not be generated."
                    )
                )


    except Exception as e:

        print(
            f"Failed to generate evaluation response: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=AI_SERVICE_PORT
    )