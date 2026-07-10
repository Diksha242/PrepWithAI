

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  createSession,
  getSessions,
  reset,
  deleteSession,
} from "../features/sessions/sessionSlice";
import { toast } from "react-toastify";
import SessionCard from "../components/SessionCard";

const PRACTICE_MODES = [
  {
    label: "Role-Based Interview",
    value: "role-based",
  },
  {
    label: "SDE Mixed Interview",
    value: "sde-mixed",
  },
  {
    label: "DSA Practice",
    value: "dsa",
  },
  {
    label: "Core Subjects",
    value: "core-subjects",
  },
];

const ROLES = [
  "MERN Stack Developer",
  "MEAN Stack Developer",
  "Full Stack Python",
  "Full Stack Java",
  "Frontend Developer",
  "Backend Developer",
  "Java Developer",
  "Python Developer",
  "Data Scientist",
  "Data Analyst",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "Cloud Engineer (AWS/Azure/GCP)",
  "Cybersecurity Engineer",
  "Blockchain Developer",
  "Mobile Developer (iOS/Android)",
  "Game Developer",
  "UI/UX Designer",
  "QA Automation Engineer",
  "Product Manager",
  "SDE",
  "AIML Engineer",
  "Full Stack Developer",
  
];

const DSA_TOPICS = [
  "Arrays",
  "Strings",
  "Linked Lists",
  "Stack & Queue",
  "Trees",
  "Graphs",
  "Hashing",
  "Recursion & Backtracking",
  "Greedy Algorithms",
  "Divide & Conquer",
  "Tries",
  "Dynamic Programming",
  "Mixed DSA",
];

const CORE_SUBJECTS = [
  "DBMS",
  "Operating Systems",
  "Computer Networks",
  "OOP",
  "SQL",
  "System Design",
  "Computer Architecture",
  "Compiler Design",
  
  "Mixed Core CS",
];

const LEVELS = ["Easy", "Medium", "Hard"];

const TYPES = [
  {
    label: "Oral Only",
    value: "oral-only",
  },
  {
    label: "Coding Mix",
    value: "coding-mix",
  },
];

const COUNTS = [5, 10, 15, 20];

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);

  const {
    sessions,
    isLoading,
    isGenerating,
    isError,
    message,
  } = useSelector((state) => state.sessions);

  const isProcessing = isGenerating;

  const [formData, setFormData] = useState({
    practiceMode: "role-based",
    role: user?.preferredRole || ROLES[0],
    topic: "",
    level: LEVELS[0],
    interviewType: TYPES[1].value,
    count: COUNTS[0],
  });

  useEffect(() => {
    dispatch(getSessions());
  }, [dispatch]);

  useEffect(() => {
    if (isError && message) {
      toast.error(message);
      dispatch(reset());
    }
  }, [isError, message, dispatch]);

  const onChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevState) => {
      const updatedData = {
        ...prevState,
        [name]: value,
      };

      // Reset dependent values when practice mode changes
      if (name === "practiceMode") {
        if (value === "role-based") {
          updatedData.role = ROLES[0];
          updatedData.topic = "";
          updatedData.interviewType = "coding-mix";
        }

        if (value === "sde-mixed") {
          updatedData.role = "SDE Mixed Interview";
          updatedData.topic = "Mixed";
          updatedData.interviewType = "coding-mix";
        }

        if (value === "dsa") {
          updatedData.role = "DSA Practice";
          updatedData.topic = DSA_TOPICS[0];
          updatedData.interviewType = "coding-mix";
        }

        if (value === "core-subjects") {
          updatedData.role = "Core CS";
          updatedData.topic = CORE_SUBJECTS[0];
          updatedData.interviewType = "oral-only";
        }
      }

      return updatedData;
    });
  };

  const onSubmit = (e) => {
    e.preventDefault();

    const sessionData = {
      ...formData,
      count: Number(formData.count),
    };

    console.log("Creating session:", sessionData);

    dispatch(createSession(sessionData));
  };

  const viewSession = (session) => {
    if (session.status === "completed") {
      navigate(`/review/${session._id}`);
    } else if (session.status === "in-progress") {
      navigate(`/interview/${session._id}`);
    } else {
      toast.info("Session not ready yet");
    }
  };

  const handleDelete = (e, sessionId) => {
    e.stopPropagation();

    if (window.confirm("Are you sure you want to delete this session?")) {
      dispatch(deleteSession(sessionId));
      toast.success("Session deleted");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-8 sm:space-y-12 animate-in duration-700">

      {/* HEADER */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 sm:pb-8">

        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Welcome,{" "}
            <span className="text-teal-600">
              {user?.name?.split(" ")[0] || "Candidate"}
            </span>
          </h1>

          <p className="text-slate-500 mt-1 text-sm sm:text-lg font-medium">
            Choose your practice mode and start preparing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-teal-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border border-teal-100 flex sm:block items-center gap-2">

            <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">
              Total Sessions
            </p>

            <p className="text-xl sm:text-2xl font-black text-teal-700 leading-none">
              {sessions.length}
            </p>

          </div>
        </div>

      </div>


      {/* NEW INTERVIEW CARD */}

      <div className="bg-white rounded-2xl sm:rounded-[2.5rem] shadow-xl sm:shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">

        <div className="bg-slate-900 px-6 py-4 sm:px-8 sm:py-6">

          <h2 className="text-lg font-bold text-white flex items-center">

            <span className="bg-teal-500 w-1.5 h-5 rounded-full mr-3"></span>

            New Practice Session

          </h2>

        </div>


        <form
          onSubmit={onSubmit}
          className="p-6 sm:p-8 space-y-6"
        >

          {/* PRACTICE MODE */}

          <div>

            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Practice Mode
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-2">

              {PRACTICE_MODES.map((mode) => (

                <button
                  key={mode.value}
                  type="button"
                  onClick={() =>
                    onChange({
                      target: {
                        name: "practiceMode",
                        value: mode.value,
                      },
                    })
                  }
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    formData.practiceMode === mode.value
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-300"
                  }`}
                >

                  <p className="font-bold text-sm">
                    {mode.label}
                  </p>

                </button>

              ))}

            </div>

          </div>


          {/* CONFIGURATION */}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 items-end">


            {/* ROLE */}

            {formData.practiceMode === "role-based" && (

              <div className="space-y-1.5">

                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Role
                </label>

                <select
                  name="role"
                  value={formData.role}
                  onChange={onChange}
                  className="w-full bg-slate-50 border-none rounded-xl sm:rounded-2xl p-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500"
                >

                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}

                </select>

              </div>

            )}


            {/* DSA TOPIC */}

            {formData.practiceMode === "dsa" && (

              <div className="space-y-1.5">

                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  DSA Topic
                </label>

                <select
                  name="topic"
                  value={formData.topic}
                  onChange={onChange}
                  className="w-full bg-slate-50 border-none rounded-xl sm:rounded-2xl p-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500"
                >

                  {DSA_TOPICS.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}

                </select>

              </div>

            )}


            {/* CORE SUBJECT */}

            {formData.practiceMode === "core-subjects" && (

              <div className="space-y-1.5">

                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Subject
                </label>

                <select
                  name="topic"
                  value={formData.topic}
                  onChange={onChange}
                  className="w-full bg-slate-50 border-none rounded-xl sm:rounded-2xl p-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500"
                >

                  {CORE_SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}

                </select>

              </div>

            )}


            {/* SDE MIXED INFO */}

            {formData.practiceMode === "sde-mixed" && (

              <div className="bg-slate-50 rounded-2xl p-3">

                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Interview Mix
                </p>

                <p className="text-xs font-semibold text-slate-600 mt-1">
                  DSA + Core CS + Development + Project Discussion
                </p>

              </div>

            )}


            {/* LEVEL */}

            <div className="space-y-1.5">

              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Level
              </label>

              <select
                name="level"
                value={formData.level}
                onChange={onChange}
                className="w-full bg-slate-50 border-none rounded-xl sm:rounded-2xl p-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500"
              >

                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}

              </select>

            </div>


            {/* QUESTION COUNT */}

            <div className="space-y-1.5">

              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Questions
              </label>

              <select
                name="count"
                value={formData.count}
                onChange={onChange}
                className="w-full bg-slate-50 border-none rounded-xl sm:rounded-2xl p-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500"
              >

                {COUNTS.map((count) => (
                  <option key={count} value={count}>
                    {count} Questions
                  </option>
                ))}

              </select>

            </div>


            {/* INTERVIEW TYPE */}

            <div className="space-y-1.5">

              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Type
              </label>

              <select
                name="interviewType"
                value={formData.interviewType}
                onChange={onChange}
                disabled={
                  formData.practiceMode === "sde-mixed" ||
                  formData.practiceMode === "dsa" ||
                  formData.practiceMode === "core-subjects"
                }
                className="w-full bg-slate-50 border-none rounded-xl sm:rounded-2xl p-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
              >

                {TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}

              </select>

            </div>


            {/* START BUTTON */}

            <button
              type="submit"
              disabled={isProcessing}
              className={`w-full h-[48px] rounded-xl font-bold text-white flex items-center justify-center gap-2 ${
                isProcessing
                  ? "bg-slate-300"
                  : "bg-teal-600 hover:bg-teal-700"
              }`}
            >

              {isProcessing ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Generating...
                </>
              ) : (
                <span className="text-sm">
                  Start Practice
                </span>
              )}

            </button>

          </div>

        </form>

      </div>


      {/* INTERVIEW HISTORY */}

      <div className="space-y-6 pb-20 sm:pb-0">

        <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center px-2">

          <span className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 text-sm sm:text-lg">
            📊
          </span>

          Interview History

        </h2>


        {isLoading && sessions.length === 0 ? (

          <div className="flex items-center justify-center py-20">

            <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-teal-500 rounded-full"></div>

          </div>

        ) : sessions.length === 0 ? (

          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl sm:rounded-[2rem] py-16 sm:py-20 text-center">

            <p className="text-slate-400 font-bold text-base sm:text-lg">
              No sessions yet.
            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {sessions.map((session) => (

              <SessionCard
                key={session._id}
                session={session}
                onClick={viewSession}
                onDelete={handleDelete}
              />

            ))}

          </div>

        )}

      </div>

    </div>
  );
};

export default Dashboard;