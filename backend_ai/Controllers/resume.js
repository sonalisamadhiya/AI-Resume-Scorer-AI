const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const ResumeModel = require('../Modals/resume');
const { GoogleGenAI } = require("@google/genai");
const multer=require('multer');

const geminiApiKey = process.env.GEMINI_API_KEY || null;

// Helper to extract "Score: XX" and "Reason: ..." from Gemini text
const parseGeminiResult = (text) => {
  let score = null;
  let reason = text.trim();

  const scoreMatch = text.match(/Score:\s*([0-9]{1,3})/i);
  if (scoreMatch) {
    score = scoreMatch[1];
  }

  const reasonMatch = text.match(/Reason:\s*([\s\S]*)/i);
  if (reasonMatch) {
    reason = reasonMatch[1].trim();
  }

  return { score, reason };
};

exports.addResume = async (req, res) => {
  try {
    const { job_desc, user } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Resume file is required' });
    }

    if (!job_desc) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    if (!user) {
      return res.status(400).json({ error: 'User id is required' });
    }

    // Read PDF from disk (multer has saved it already)
    const pdfPath = path.join(__dirname, '..', 'uploads', req.file.filename);

    let pdfText = '';
    try {
      const dataBuffer = fs.readFileSync(pdfPath);
      const pdfData = await pdfParse(dataBuffer);
      pdfText = pdfData.text || '';
    } catch (pdfErr) {
      console.error('Error parsing PDF:', pdfErr);
      pdfText = '';
    }

    const prompt = `You are a resume screening assistant.
Compare the following resume text with the provided Job Description (JD) and give a match score (0-100) and feedback.

Resume:
${pdfText}

Job Description:
${job_desc}

Return the score and a brief explanation in this format:
Score: XX
Reason: ...`;

    let score = null;
    let feedback = 'Analysis not available';

if (!geminiApiKey) {
      feedback =
        'Gemini API key not configured. Please set GEMINI_API_KEY in the backend .env to enable AI analysis.';
    } else {
      try {
      const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
});

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: prompt,
});

const resultText = response.text || "";
        const parsed = parseGeminiResult(resultText);
        score = parsed.score;
        feedback = parsed.reason || resultText;
      } catch (geminiErr) {
        console.error('Error calling Gemini:', geminiErr);
        feedback =
          'There was an issue contacting the AI service. Your resume was saved, but no AI analysis could be generated.';
      }
    }

    const newResume = new ResumeModel({
      user,
      resume_name: req.file.originalname,
      job_desc,
      score,
      feedback,
    });

    await newResume.save();

    // remove temp file
    fs.unlinkSync(pdfPath);

    res
      .status(200)
      .json({ message: 'Your analysis is ready', data: newResume });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: 'Server error', message: err.message });
  }
};

exports.getAllResumesForUser = async (req, res) => {
  try {
    const { user } = req.params;
    if (!user) {
      return res.status(400).json({ error: 'User id is required' });
    }

    const resumes = await ResumeModel.find({ user }).sort({ createdAt: -1 });
    return res.status(200).json({ data: resumes });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: 'Server error', message: err.message });
  }
};

exports.getResumeForAdmin = async (req, res) => {
  try {
    const resumes = await ResumeModel.find({}).populate('user').sort({ createdAt: -1 });
    return res.status(200).json({ data: resumes });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: 'Server error', message: err.message });
  }
};