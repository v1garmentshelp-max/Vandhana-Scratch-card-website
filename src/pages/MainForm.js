import React, { useEffect, useState } from "react";
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
  city: "",
  whatsappOptIn: false
};

const API_BASE_URL = "https://vandhana-scratch-card-backend.vercel.app";

export default function MainForm() {
  const [formData, setFormData] = useState(initialForm);
  const [children, setChildren] = useState([]);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    try {
      const savedData = JSON.parse(
        localStorage.getItem("vandhana_user_form") || "null"
      );

      if (savedData?.formData?.mobileNumber) {
        setFormData({
          ...initialForm,
          ...savedData.formData
        });
        setChildren(Array.isArray(savedData.children) ? savedData.children : []);
        setIsFormSubmitted(Boolean(savedData.isFormSubmitted));
        setCustomerId(savedData.customerId || "");
      }
    } catch {
      localStorage.removeItem("vandhana_user_form");
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    setError("");
    setSuccessMsg("");

    if (type === "checkbox" && name === "whatsappOptIn") {
      setFormData((prev) => ({
        ...prev,
        whatsappOptIn: checked
      }));
      return;
    }

    if (name === "mobileNumber") {
      const cleaned = value.replace(/\D/g, "").slice(0, 10);

      setFormData((prev) => ({
        ...prev,
        mobileNumber: cleaned
      }));
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

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChildChange = (index, field, value) => {
    setError("");
    setSuccessMsg("");

    setChildren((prev) =>
      prev.map((child, childIndex) =>
        childIndex === index
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
    setChildren((prev) => prev.filter((_, childIndex) => childIndex !== index));
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
        if (!Array.isArray(children) || children.length === 0) {
          return "Please add child details";
        }

        for (let index = 0; index < children.length; index += 1) {
          if (!nameRegex.test((children[index].name || "").trim())) {
            return `Please enter a valid name for child ${index + 1}`;
          }

          if (!children[index].dob) {
            return `Please select date of birth for child ${index + 1}`;
          }
        }
      }
    }

    return "";
  };

  const saveSuccessfulSubmission = ({
    normalizedFormData,
    normalizedChildren,
    customerId: savedCustomerId,
    spinToken
  }) => {
    const savedPayload = {
      formData: normalizedFormData,
      children: normalizedChildren,
      customerId: savedCustomerId || "",
      spinToken: spinToken || "",
      isFormSubmitted: true
    };

    localStorage.setItem("vandhana_user_form", JSON.stringify(savedPayload));
    localStorage.removeItem("vandhana_reset");
    setFormData(normalizedFormData);
    setChildren(normalizedChildren);
    setCustomerId(savedCustomerId || "");
    setIsFormSubmitted(true);
    setSuccessMsg("Form submitted successfully.");
  };

  const createExistingCustomerAccess = async ({
    normalizedFormData,
    normalizedChildren
  }) => {
    const response = await fetch(`${API_BASE_URL}/api/customers/spin-access`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mobileNumber: normalizedFormData.mobileNumber,
        dateOfBirth: normalizedFormData.dateOfBirth
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Unable to continue with this customer");
    }

    saveSuccessfulSubmission({
      normalizedFormData,
      normalizedChildren,
      customerId: data.customerId,
      spinToken: data.spinToken
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError("");
    setSuccessMsg("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const normalizedFormData = {
      ...formData,
      customerName: formData.customerName.trim(),
      spouseName:
        formData.maritalStatus === "Married"
          ? formData.spouseName.trim()
          : "",
      spouseDob:
        formData.maritalStatus === "Married" ? formData.spouseDob : "",
      hasChildren:
        formData.maritalStatus === "Married" ? formData.hasChildren : "",
      city: formData.city.trim()
    };

    const normalizedChildren =
      formData.maritalStatus === "Married" &&
      formData.hasChildren === "Yes"
        ? children.map((child) => ({
            name: child.name.trim(),
            dob: child.dob
          }))
        : [];

    const payload = {
      customerName: normalizedFormData.customerName,
      mobileNumber: normalizedFormData.mobileNumber,
      gender: normalizedFormData.gender,
      dateOfBirth: normalizedFormData.dateOfBirth,
      maritalStatus: normalizedFormData.maritalStatus,
      spouseName: normalizedFormData.spouseName,
      spouseDob: normalizedFormData.spouseDob,
      hasChildren:
        normalizedFormData.maritalStatus === "Married"
          ? normalizedFormData.hasChildren === "Yes"
          : false,
      shoppingPreference: normalizedFormData.shoppingPreference,
      city: normalizedFormData.city,
      whatsappOptIn: Boolean(normalizedFormData.whatsappOptIn),
      children: normalizedChildren.map((child) => ({
        childName: child.name,
        childDob: child.dob
      }))
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

      const data = await response.json().catch(() => ({}));

      if (response.status === 409) {
        await createExistingCustomerAccess({
          normalizedFormData,
          normalizedChildren
        });
        return;
      }

      if (!response.ok) {
        setError(data.message || "Failed to submit form");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (!data.spinToken) {
        setError("Spin access was not created. Please try again.");
        return;
      }

      saveSuccessfulSubmission({
        normalizedFormData,
        normalizedChildren,
        customerId: data.customerId,
        spinToken: data.spinToken
      });
    } catch (requestError) {
      setError(requestError.message || "Unable to connect to server");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    window.location.href = "/scratch";
  };

  const handleReset = () => {
    localStorage.removeItem("vandhana_user_form");
    localStorage.removeItem("vandhana_reset");
    setFormData(initialForm);
    setChildren([]);
    setIsFormSubmitted(false);
    setCustomerId("");
    setError("");
    setSuccessMsg("");
  };

  return (
    <div className="mf-page">
      <div className="mf-bg-shape mf-bg-shape-one" />
      <div className="mf-bg-shape mf-bg-shape-two" />
      <div className="mf-bg-shape mf-bg-shape-three" />

      <div className="mf-container">
        <section className="mf-hero">
          <div className="mf-brand-row">
            <div className="mf-logo">V</div>
            <div className="mf-brand-text">
              <p>Vandhana Shopping Mall</p>
              <h1>Spin and Win</h1>
            </div>
          </div>

          <div className="mf-reward-card">
            <div className="mf-reward-content">
              <span className="mf-pill">Exclusive Reward Entry</span>
              <h2>Register now and unlock your spin reward</h2>
              <p>
                Complete your details below and spin the wheel to reveal your
                reward.
              </p>
            </div>

            <div className="mf-ticket">
              <div>
                <span>Reward Pass</span>
                <h3>Spin & Win</h3>
                <p>Discounts and exciting gifts</p>
              </div>
              <div className="mf-ticket-badge">WIN</div>
            </div>
          </div>

          <div className="mf-progress-card">
            <div
              className={`mf-progress-step ${
                !isFormSubmitted ? "active" : "done"
              }`}
            >
              <span>1</span>
              <p>Register</p>
            </div>

            <div className="mf-progress-line" />

            <div
              className={`mf-progress-step ${
                isFormSubmitted ? "active" : ""
              }`}
            >
              <span>2</span>
              <p>Spin</p>
            </div>

            <div className="mf-progress-line" />

            <div className="mf-progress-step">
              <span>3</span>
              <p>Reward</p>
            </div>
          </div>
        </section>

        {!isFormSubmitted ? (
          <section className="mf-form-card">
            <div className="mf-form-head">
              <span className="mf-section-badge">Step 1</span>
              <h3>Customer Registration</h3>
              <p>Please enter the details carefully to continue.</p>
            </div>

            {error ? (
              <div className="mf-alert mf-alert-error">{error}</div>
            ) : null}

            {successMsg ? (
              <div className="mf-alert mf-alert-success">{successMsg}</div>
            ) : null}

            <form className="mf-form" onSubmit={handleSubmit} noValidate>
              <div className="mf-panel">
                <div className="mf-panel-head">
                  <div>
                    <h4>Basic Details</h4>
                    <span>All fields are required</span>
                  </div>
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
                      autoComplete="name"
                    />
                  </div>

                  <div className="mf-field">
                    <label>Mobile Number</label>
                    <input
                      type="text"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      placeholder="10 digit mobile number"
                      disabled={isSubmitting}
                      inputMode="numeric"
                      autoComplete="tel"
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
                      autoComplete="address-level2"
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
                <div className="mf-panel mf-family-panel">
                  <div className="mf-panel-head">
                    <div>
                      <h4>Family Details</h4>
                      <span>Shown for married customers</span>
                    </div>
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
                                    handleChildChange(
                                      index,
                                      "name",
                                      e.target.value
                                    )
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
                                    handleChildChange(
                                      index,
                                      "dob",
                                      e.target.value
                                    )
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

              <label className="mf-consent-card">
                <input
                  type="checkbox"
                  name="whatsappOptIn"
                  checked={formData.whatsappOptIn}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />

                <span>
                  I agree to receive birthday wishes and offers from Vandhana
                  Shopping Mall on WhatsApp.
                </span>
              </label>

              <div className="mf-submit-row">
                <button
                  type="submit"
                  className="mf-primary-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Form"}
                </button>
              </div>
            </form>
          </section>
        ) : (
          <section className="mf-success-wrap">
            <div className="mf-success-card">
              <div className="mf-success-icon">✓</div>
              <span className="mf-section-badge">Step 1 Completed</span>

              <h3>Registration Successful</h3>

              <p>
                Your details have been saved successfully. You can now continue
                to the spin wheel.
              </p>

              {customerId ? (
                <div className="mf-customer-id">
                  Customer ID: {customerId}
                </div>
              ) : null}

              <div className="mf-success-actions">
                <button
                  type="button"
                  className="mf-primary-btn"
                  onClick={handleNext}
                >
                  Spin the Wheel
                </button>

                <button
                  type="button"
                  className="mf-secondary-btn"
                  onClick={handleReset}
                >
                  Fill Again
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}