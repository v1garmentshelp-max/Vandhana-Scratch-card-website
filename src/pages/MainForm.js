import React, { useEffect, useMemo, useState } from "react";
import "./MainForm.css";

const initialForm = {
  customerName: "",
  mobileNumber: "",
  gender: "",
  dateOfBirth: "",
  maritalStatus: "",
  spouseName: "",
  spouseDob: "",
  hasChildren: "",
  shoppingPreference: "",
  city: ""
};

const API_BASE_URL = "http://localhost:5000";

export default function MainForm() {
  const [formData, setFormData] = useState(initialForm);
  const [children, setChildren] = useState([]);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const savedData = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("vandhana_user_form") || "null");
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (savedData?.formData?.mobileNumber) {
      setFormData(savedData.formData);
      setChildren(savedData.children || []);
      setIsFormSubmitted(Boolean(savedData.isFormSubmitted));
      setCustomerId(savedData.customerId || "");
    }
  }, [savedData]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "mobileNumber") {
      const cleaned = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: cleaned }));
      return;
    }

    if (name === "maritalStatus") {
      if (value !== "Married") {
        setChildren([]);
      }

      setFormData((prev) => ({
        ...prev,
        maritalStatus: value,
        spouseName: value === "Married" ? prev.spouseName : "",
        spouseDob: value === "Married" ? prev.spouseDob : "",
        hasChildren: value === "Married" ? prev.hasChildren : ""
      }));
      return;
    }

    if (name === "hasChildren") {
      if (value === "No") {
        setChildren([]);
      }

      if (value === "Yes" && children.length === 0) {
        setChildren([{ name: "", dob: "" }]);
      }

      setFormData((prev) => ({
        ...prev,
        hasChildren: value
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChildChange = (index, field, value) => {
    setChildren((prev) =>
      prev.map((child, i) =>
        i === index
          ? {
              ...child,
              [field]: value
            }
          : child
      )
    );
  };

  const addChild = () => {
    setChildren((prev) => [...prev, { name: "", dob: "" }]);
  };

  const removeChild = (index) => {
    setChildren((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const nameRegex = /^[A-Za-z ]{3,}$/;
    const mobileRegex = /^[6789]\d{9}$/;

    if (!nameRegex.test(formData.customerName.trim())) {
      return "Please enter a valid customer name";
    }

    if (!mobileRegex.test(formData.mobileNumber)) {
      return "Please enter a valid 10 digit mobile number starting with 6, 7, 8 or 9";
    }

    if (!formData.gender) {
      return "Please select gender";
    }

    if (!formData.dateOfBirth) {
      return "Please select date of birth";
    }

    if (!formData.maritalStatus) {
      return "Please select marital status";
    }

    if (!formData.shoppingPreference) {
      return "Please select shopping preference";
    }

    if (!formData.city.trim()) {
      return "Please enter city";
    }

    if (formData.maritalStatus === "Married") {
      if (!nameRegex.test((formData.spouseName || "").trim())) {
        return "Please enter a valid wife name";
      }

      if (!formData.spouseDob) {
        return "Please select wife date of birth";
      }

      if (!formData.hasChildren) {
        return "Please select children status";
      }

      if (formData.hasChildren === "Yes") {
        if (children.length === 0) {
          return "Please add child details";
        }

        for (let i = 0; i < children.length; i += 1) {
          if (!nameRegex.test((children[i].name || "").trim())) {
            return `Please enter a valid name for child ${i + 1}`;
          }

          if (!children[i].dob) {
            return `Please select date of birth for child ${i + 1}`;
          }
        }
      }
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      customerName: formData.customerName.trim(),
      mobileNumber: formData.mobileNumber,
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth,
      maritalStatus: formData.maritalStatus,
      spouseName: formData.maritalStatus === "Married" ? formData.spouseName.trim() : "",
      spouseDob: formData.maritalStatus === "Married" ? formData.spouseDob : "",
      hasChildren: formData.maritalStatus === "Married" ? formData.hasChildren === "Yes" : false,
      shoppingPreference: formData.shoppingPreference,
      city: formData.city.trim(),
      children:
        formData.maritalStatus === "Married" && formData.hasChildren === "Yes"
          ? children.map((child) => ({
              childName: child.name.trim(),
              childDob: child.dob
            }))
          : []
    };

    try {
      setIsSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/api/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to submit form");
        setIsSubmitting(false);
        return;
      }

      const savedPayload = {
        formData,
        children,
        customerId: data.customerId || "",
        isFormSubmitted: true
      };

      localStorage.setItem("vandhana_user_form", JSON.stringify(savedPayload));
      setCustomerId(data.customerId || "");
      setIsFormSubmitted(true);
      setSuccessMsg("Form submitted successfully.");
    } catch (err) {
      setError("Unable to connect to server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    window.location.href = "/scratch";
  };

  const handleReset = () => {
    localStorage.removeItem("vandhana_user_form");
    setFormData(initialForm);
    setChildren([]);
    setIsFormSubmitted(false);
    setCustomerId("");
    setError("");
    setSuccessMsg("");
  };

  return (
    <div className="mf-page">
      <div className="mf-container">
        <div className="mf-hero">
          <div className="mf-hero-left">
            <div className="mf-brand-row">
              <div className="mf-logo">V</div>
              <div className="mf-brand-text">
                <p>Vandhana Shopping Mall</p>
                <h1>Scratch and Win</h1>
              </div>
            </div>

            <div className="mf-hero-copy">
              <span className="mf-pill">Exclusive Reward Entry</span>
              <h2>Shop. Register. Unlock your reward.</h2>
              <p>
                Fill in your details and move to the next step to reveal your scratch card reward.
              </p>
            </div>

            <div className="mf-hero-stats">
              <div className="mf-stat-card">
                <strong>Step 1</strong>
                <span>Submit your details</span>
              </div>
              <div className="mf-stat-card">
                <strong>Step 2</strong>
                <span>Go to next screen</span>
              </div>
              <div className="mf-stat-card mf-stat-highlight">
                <strong>Reward</strong>
                <span>Up to 10% Discount</span>
              </div>
            </div>
          </div>

          <div className="mf-hero-right">
            <div className="mf-preview-card">
              <div className="mf-preview-top">
                <div className="mf-preview-dots">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <div className="mf-ticket">
                <div className="mf-ticket-left">
                  <span>Reward Pass</span>
                  <h3>Scratch Card Access</h3>
                  <p>Complete the form to continue</p>
                </div>
                <div className="mf-ticket-right">10%</div>
              </div>
            </div>
          </div>
        </div>

        {!isFormSubmitted ? (
          <div className="mf-form-card">
            <div className="mf-form-head">
              <div>
                <span className="mf-section-badge">Step 1</span>
                <h3>Customer Registration</h3>
                <p>Please enter the details below carefully</p>
              </div>
            </div>

            {error ? <div className="mf-alert mf-alert-error">{error}</div> : null}
            {successMsg ? <div className="mf-alert mf-alert-success">{successMsg}</div> : null}

            <form className="mf-form" onSubmit={handleSubmit}>
              <div className="mf-panel">
                <div className="mf-panel-head">
                  <h4>Basic Details</h4>
                  <span>Required information</span>
                </div>

                <div className="mf-grid">
                  <div className="mf-field">
                    <label>Customer Name</label>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="mf-field">
                    <label>Mobile Number</label>
                    <input
                      type="text"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      placeholder="Enter 10 digit mobile number"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="mf-field">
                    <label>Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="mf-field">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="mf-field">
                    <label>Marital Status</label>
                    <select
                      name="maritalStatus"
                      value={formData.maritalStatus}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    >
                      <option value="">Select marital status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                    </select>
                  </div>

                  <div className="mf-field">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Enter city"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="mf-field mf-field-full">
                    <label>Shopping Preference</label>
                    <select
                      name="shoppingPreference"
                      value={formData.shoppingPreference}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    >
                      <option value="">Select shopping preference</option>
                      <option value="Mens Wear">Mens Wear</option>
                      <option value="Womens Wear">Womens Wear</option>
                      <option value="Kids Wear">Kids Wear</option>
                      <option value="Family Shopping">Family Shopping</option>
                    </select>
                  </div>
                </div>
              </div>

              {formData.maritalStatus === "Married" ? (
                <div className="mf-panel">
                  <div className="mf-panel-head">
                    <h4>Family Details</h4>
                    <span>Shown for married customers</span>
                  </div>

                  <div className="mf-grid">
                    <div className="mf-field">
                      <label>Wife Name</label>
                      <input
                        type="text"
                        name="spouseName"
                        value={formData.spouseName}
                        onChange={handleChange}
                        placeholder="Enter wife name"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="mf-field">
                      <label>Wife Date of Birth</label>
                      <input
                        type="date"
                        name="spouseDob"
                        value={formData.spouseDob}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="mf-field mf-field-full">
                      <label>Any Children</label>
                      <select
                        name="hasChildren"
                        value={formData.hasChildren}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      >
                        <option value="">Select option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>

                  {formData.hasChildren === "Yes" ? (
                    <div className="mf-children-wrap">
                      <div className="mf-children-head">
                        <div>
                          <h5>Children Details</h5>
                          <p>Add each child below</p>
                        </div>
                        <button
                          type="button"
                          className="mf-outline-btn"
                          onClick={addChild}
                          disabled={isSubmitting}
                        >
                          Add Child
                        </button>
                      </div>

                      <div className="mf-children-list">
                        {children.map((child, index) => (
                          <div className="mf-child-card" key={index}>
                            <div className="mf-child-card-top">
                              <span>Child {index + 1}</span>
                              {children.length > 1 ? (
                                <button
                                  type="button"
                                  className="mf-remove-btn"
                                  onClick={() => removeChild(index)}
                                  disabled={isSubmitting}
                                >
                                  Remove
                                </button>
                              ) : null}
                            </div>

                            <div className="mf-grid">
                              <div className="mf-field">
                                <label>Child Name</label>
                                <input
                                  type="text"
                                  value={child.name}
                                  onChange={(e) =>
                                    handleChildChange(index, "name", e.target.value)
                                  }
                                  placeholder="Enter child name"
                                  disabled={isSubmitting}
                                />
                              </div>

                              <div className="mf-field">
                                <label>Child Date of Birth</label>
                                <input
                                  type="date"
                                  value={child.dob}
                                  onChange={(e) =>
                                    handleChildChange(index, "dob", e.target.value)
                                  }
                                  disabled={isSubmitting}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="mf-submit-row">
                <button type="submit" className="mf-primary-btn" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Form"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="mf-success-wrap">
            <div className="mf-success-card">
              <div className="mf-success-top">
                <div className="mf-success-icon">✓</div>
                <span className="mf-section-badge">Step 1 Completed</span>
              </div>

              <h3>Registration Successful</h3>
              <p>Your details have been saved successfully. You can now continue to the next step.</p>

              {customerId ? <div className="mf-customer-id">Customer ID: {customerId}</div> : null}

              <div className="mf-success-actions">
                <button className="mf-primary-btn" onClick={handleNext}>
                  Next
                </button>
                <button className="mf-secondary-btn" onClick={handleReset}>
                  Fill Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}