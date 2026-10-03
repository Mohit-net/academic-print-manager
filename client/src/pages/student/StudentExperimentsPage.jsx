import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  semestersApi,
  subjectsApi,
  experimentsApi,
  documentsApi,
} from "../../api/client";
import AlertBanner from "../../components/common/AlertBanner";
import DataTable from "../../components/common/DataTable";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import UploadModal from "../../components/student/UploadModal";

export default function StudentExperimentsPage() {
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  // Upload modal state
  const [uploadTargetExp, setUploadTargetExp] = useState(null);

  const fetchExperimentsAndDocs = async () => {
    setIsLoading(true);
    try {
      const [exps, docs] = await Promise.all([
        experimentsApi.getAll(selectedSubject || undefined),
        documentsApi.getMyDocuments(),
      ]);

      setDocuments(docs);

      if (selectedSemester && !selectedSubject) {
        const semSubjIds = new Set(
          subjects
            .filter((s) => (s.semester?._id || s.semester) === selectedSemester)
            .map((s) => s._id)
        );
        setExperiments(
          exps.filter((e) => semSubjIds.has(e.subject?._id || e.subject))
        );
      } else {
        setExperiments(exps);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load experiments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [sems, subjs, exps, docs] = await Promise.all([
          semestersApi.getAll(),
          subjectsApi.getAll(),
          experimentsApi.getAll(selectedSubject || undefined),
          documentsApi.getMyDocuments(),
        ]);

        if (isMounted) {
          setSemesters(sems);
          setSubjects(subjs);
          setDocuments(docs);

          if (selectedSemester && !selectedSubject) {
            const semSubjIds = new Set(
              subjs
                .filter((s) => (s.semester?._id || s.semester) === selectedSemester)
                .map((s) => s._id)
            );
            setExperiments(
              exps.filter((e) => semSubjIds.has(e.subject?._id || e.subject))
            );
          } else {
            setExperiments(exps);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Failed to load experiments.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [selectedSemester, selectedSubject]);

  // Map experiment ID to uploaded document if present
  const docByExpId = new Map();
  for (const doc of documents) {
    const expId = doc.experiment?._id || doc.experiment;
    if (expId) {
      docByExpId.set(expId, doc);
    }
  }

  const filteredSubjectsForSelect = selectedSemester
    ? subjects.filter((s) => (s.semester?._id || s.semester) === selectedSemester)
    : subjects;

  const handleViewPdf = (doc) => {
    navigate(`/student/view/${doc._id}`);
  };

  const columns = [
    {
      title: "Exp #",
      key: "experimentNumber",
      width: "90px",
      render: (row) => <span className="chip-badge">#{row.experimentNumber}</span>,
    },
    {
      title: "Title & Details",
      key: "title",
      render: (row) => (
        <div>
          <strong>{row.title || `Experiment ${row.experimentNumber}`}</strong>
          {row.description && <p className="table-subtext">{row.description}</p>}
        </div>
      ),
    },
    {
      title: "Subject",
      key: "subject",
      width: "180px",
      render: (row) => <span>{row.subject?.name || "—"}</span>,
    },
    {
      title: "Status",
      key: "status",
      width: "150px",
      render: (row) => {
        const uploadedDoc = docByExpId.get(row._id);
        return uploadedDoc ? (
          <span className="status-pill status-success">✓ Uploaded</span>
        ) : (
          <span className="status-pill status-pending">Not Uploaded</span>
        );
      },
    },
    {
      title: "Action",
      key: "actions",
      width: "160px",
      className: "actions-col",
      render: (row) => {
        const uploadedDoc = docByExpId.get(row._id);
        if (uploadedDoc) {
          return (
            <div className="table-actions">
              <button
                className="secondary-button-sm"
                onClick={() => handleViewPdf(uploadedDoc)}
              >
                View PDF
              </button>
            </div>
          );
        }

        return (
          <button
            className="primary-button-sm"
            onClick={() => setUploadTargetExp(row)}
          >
            + Upload PDF
          </button>
        );
      },
    },
  ];

  return (
    <div className="student-page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Academic Curriculum</span>
          <h1>Browse Experiments</h1>
          <p>Find lab assignments and upload your prepared PDF documents.</p>
        </div>
        <Link to="/student/documents" className="secondary-button">
          View My Documents ({documents.length})
        </Link>
      </section>

      {/* Filter Bar */}
      <section className="filter-bar">
        <div className="filter-group">
          <label htmlFor="student-filter-sem">Semester:</label>
          <select
            id="student-filter-sem"
            className="form-select"
            value={selectedSemester}
            onChange={(e) => {
              setSelectedSemester(e.target.value);
              setSelectedSubject("");
            }}
          >
            <option value="">All Semesters</option>
            {semesters.map((sem) => (
              <option key={sem._id} value={sem._id}>
                Semester {sem.number} ({sem.name})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="student-filter-subj">Subject:</label>
          <select
            id="student-filter-subj"
            className="form-select"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">All Subjects ({filteredSubjectsForSelect.length})</option>
            {filteredSubjectsForSelect.map((subj) => (
              <option key={subj._id} value={subj._id}>
                {subj.name} {subj.code ? `(${subj.code})` : ""}
              </option>
            ))}
          </select>
        </div>
      </section>

      <AlertBanner message={error} type="error" onClose={() => setError("")} />
      <AlertBanner message={successMsg} type="success" onClose={() => setSuccessMsg("")} />

      {isLoading ? (
        <LoadingSpinner text="Loading experiments and document status…" />
      ) : (
        <DataTable
          columns={columns}
          data={experiments}
          emptyMessage={
            selectedSubject
              ? "No experiments found for this subject."
              : "No experiments currently available in the curriculum."
          }
        />
      )}

      {/* Upload PDF Modal */}
      <UploadModal
        isOpen={!!uploadTargetExp}
        onClose={() => setUploadTargetExp(null)}
        experiment={uploadTargetExp}
        onSuccess={() => {
          setSuccessMsg(
            `PDF successfully uploaded for Experiment #${uploadTargetExp?.experimentNumber}!`
          );
          fetchExperimentsAndDocs();
        }}
      />
    </div>
  );
}
