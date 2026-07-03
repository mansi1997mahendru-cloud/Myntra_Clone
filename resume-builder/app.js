// ==========================================
// RESUME BUILDER STATE MANAGEMENT
// ==========================================

// Pre-filled Premium Sample Data
const sampleResumeData = {
    personal: {
        fullName: "Alexander Wright",
        jobTitle: "Principal Full-Stack Engineer",
        email: "alexander.wright@dev.com",
        phone: "+1 (555) 382-9021",
        location: "San Francisco, CA",
        website: "alexwright.dev",
        linkedin: "linkedin.com/in/alexwright",
        github: "github.com/alexwright",
        summary: "Forward-thinking Principal Engineer with 8+ years of expertise in designing, building, and scaling cloud-native web applications. Proven track record of leading high-performance engineering teams, establishing robust CI/CD pipelines, and executing seamless migrations to microservices architectures. Passionate about developer experience, systems performance, and clean code aesthetics."
    },
    experience: [
        {
            company: "Stripe",
            position: "Lead Software Engineer",
            startDate: "Jan 2023",
            endDate: "Present",
            description: "• Spearheaded the redesign of core billing APIs, improving transaction throughput by 42% under high congestion.\n• Led a cross-functional team of 6 engineers to launch a global subscriptions product, generating $14M ARR in its first quarter.\n• Championed developer productivity initiatives, reducing average local setup times from 2 hours to 10 minutes through containerized automation."
        },
        {
            company: "Netflix",
            position: "Senior Full-Stack Engineer",
            startDate: "Mar 2020",
            endDate: "Dec 2022",
            description: "• Architected dynamic content recommendations engine using React and Node.js microservices, handling over 10M concurrent sessions.\n• Optimized frontend bundle sizes by 35% through dynamic imports, tree-shaking, and custom asset pipeline compilation.\n• Mentored 4 mid-level developers and established standard review practices to maintain clean, scalable code quality."
        }
    ],
    education: [
        {
            institution: "Stanford University",
            degree: "Master of Science",
            field: "Computer Science",
            gradYear: "2019",
            gpa: "3.92 / 4.0"
        },
        {
            institution: "University of California, Berkeley",
            degree: "Bachelor of Science",
            field: "Electrical Engineering & Computer Sciences",
            gradYear: "2017",
            gpa: "3.85 / 4.0"
        }
    ],
    projects: [
        {
            title: "Aura Orchestration Engine",
            tech: "Go, Kubernetes, gRPC",
            link: "github.com/alexwright/aura",
            description: "An open-source distributed task-scheduling engine designed for low-latency asynchronous job orchestrations. Processes up to 100k events/sec with fault-tolerant recovery protocols."
        },
        {
            title: "Vapor Design System",
            tech: "React, Web Components, CSS Variables",
            link: "vapor-ui.dev",
            description: "A comprehensive, high-accessibility (WCAG AA compliant) component library adopted by enterprise teams. Features dark mode, responsive grids, and fluid animation tokens."
        }
    ],
    skills: [
        {
            category: "Languages",
            items: "TypeScript, JavaScript (ES6+), Go, Python, HTML5, CSS3, SQL"
        },
        {
            category: "Frameworks & Tools",
            items: "React, Next.js, Node.js, Express, Docker, Kubernetes, AWS, Git"
        },
        {
            category: "Database & Testing",
            items: "PostgreSQL, MongoDB, Redis, Jest, Cypress, GraphQL"
        }
    ],
    languages: [
        { name: "English", level: "Native Proficiency" },
        { name: "Spanish", level: "Professional Working" }
    ],
    certifications: [
        { name: "AWS Certified Solutions Architect – Professional", authority: "Amazon Web Services (2024)" },
        { name: "Certified Kubernetes Administrator (CKA)", authority: "The Linux Foundation (2023)" }
    ]
};

// Global App State
let resumeData = JSON.parse(JSON.stringify(sampleResumeData)); // Deep copy
let activeTemplate = 'modern';
let zoomScale = 75; // percentage

// ==========================================
// APP INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // Load from LocalStorage if it exists
    const savedData = localStorage.getItem("antigravity_resume_data");
    const savedTemplate = localStorage.getItem("antigravity_resume_template");
    
    if (savedData) {
        try {
            resumeData = JSON.parse(savedData);
        } catch (e) {
            console.error("Error loading local storage data, using defaults", e);
        }
    }
    
    if (savedTemplate) {
        activeTemplate = savedTemplate;
    }
    
    // Setup UI components
    initEditorForms();
    selectTemplate(activeTemplate);
    
    // Auto fit zoom on launch
    setTimeout(autoFitZoom, 300);
    window.addEventListener("resize", autoFitZoom);
});

// ==========================================
// FORM REDIRECT & EDITORS SETUP
// ==========================================

// Switch main editor sidebar tab
function switchEditorTab(tabId) {
    // Update active tab button
    const tabs = document.querySelectorAll(".editor-tab");
    tabs.forEach(tab => {
        if (tab.getAttribute("onclick").includes(`'${tabId}'`)) {
            tab.classList.add("active");
        } else {
            tab.classList.remove("active");
        }
    });

    // Update active tab panel content
    const contents = document.querySelectorAll(".tab-content");
    contents.forEach(content => {
        if (content.id === `tab-${tabId}`) {
            content.classList.add("active");
        } else {
            content.classList.remove("active");
        }
    });
}

// Initial binding of data elements to form inputs
function initEditorForms() {
    // Bind Personal Details
    document.getElementById("input-fullName").value = resumeData.personal.fullName || "";
    document.getElementById("input-jobTitle").value = resumeData.personal.jobTitle || "";
    document.getElementById("input-email").value = resumeData.personal.email || "";
    document.getElementById("input-phone").value = resumeData.personal.phone || "";
    document.getElementById("input-location").value = resumeData.personal.location || "";
    document.getElementById("input-website").value = resumeData.personal.website || "";
    document.getElementById("input-linkedin").value = resumeData.personal.linkedin || "";
    document.getElementById("input-github").value = resumeData.personal.github || "";
    document.getElementById("input-summary").value = resumeData.personal.summary || "";

    // Render lists
    renderListForm('experience');
    renderListForm('education');
    renderListForm('projects');
    
    // Render Custom Categorized Lists
    renderSkillsForm();
    renderLanguagesForm();
    renderCertificationsForm();
}

// Update single input field dynamically
function updateField(section, key, value) {
    if (section === 'personal') {
        resumeData.personal[key] = value;
    }
    saveDataAndRefresh();
}

// ==========================================
// DYNAMIC DUAL-PANEL RENDERING
// ==========================================

// Generic List Form Renderer (Work Experience, Education, Projects)
function renderListForm(section) {
    const container = document.getElementById(`${section}-list-container`);
    container.innerHTML = "";
    
    const items = resumeData[section] || [];
    
    items.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "card-entry";
        
        let cardTitle = "";
        let formFieldsHTML = "";
        
        if (section === 'experience') {
            cardTitle = item.company ? `${item.position || 'Position'} at ${item.company}` : "New Work Experience";
            formFieldsHTML = `
                <div class="form-grid">
                    <div class="form-group">
                        <label>Company / Organization</label>
                        <input type="text" value="${item.company || ''}" placeholder="e.g. Stripe" oninput="updateListValue('experience', ${index}, 'company', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Job Title</label>
                        <input type="text" value="${item.position || ''}" placeholder="e.g. Lead Engineer" oninput="updateListValue('experience', ${index}, 'position', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Start Date</label>
                        <input type="text" value="${item.startDate || ''}" placeholder="e.g. Jan 2023" oninput="updateListValue('experience', ${index}, 'startDate', this.value)">
                    </div>
                    <div class="form-group">
                        <label>End Date</label>
                        <input type="text" value="${item.endDate || ''}" placeholder="e.g. Present or Dec 2024" oninput="updateListValue('experience', ${index}, 'endDate', this.value)">
                    </div>
                    <div class="form-group col-span-2">
                        <label>Job Description / Key Achievements</label>
                        <textarea rows="4" placeholder="• Bullet point accomplishments..." oninput="updateListValue('experience', ${index}, 'description', this.value)">${item.description || ''}</textarea>
                    </div>
                </div>
            `;
        } else if (section === 'education') {
            cardTitle = item.institution ? `${item.degree || 'Degree'} - ${item.institution}` : "New Education Details";
            formFieldsHTML = `
                <div class="form-grid">
                    <div class="form-group">
                        <label>School / University</label>
                        <input type="text" value="${item.institution || ''}" placeholder="e.g. Stanford University" oninput="updateListValue('education', ${index}, 'institution', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Degree Obtained</label>
                        <input type="text" value="${item.degree || ''}" placeholder="e.g. Master of Science" oninput="updateListValue('education', ${index}, 'degree', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Field of Study</label>
                        <input type="text" value="${item.field || ''}" placeholder="e.g. Computer Science" oninput="updateListValue('education', ${index}, 'field', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Graduation Year</label>
                        <input type="text" value="${item.gradYear || ''}" placeholder="e.g. 2019" oninput="updateListValue('education', ${index}, 'gradYear', this.value)">
                    </div>
                    <div class="form-group col-span-2">
                        <label>Grade / GPA / Details</label>
                        <input type="text" value="${item.gpa || ''}" placeholder="e.g. GPA 3.92 / 4.0 or First Class Honors" oninput="updateListValue('education', ${index}, 'gpa', this.value)">
                    </div>
                </div>
            `;
        } else if (section === 'projects') {
            cardTitle = item.title || "New Project Highlight";
            formFieldsHTML = `
                <div class="form-grid">
                    <div class="form-group col-span-2">
                        <label>Project Title</label>
                        <input type="text" value="${item.title || ''}" placeholder="e.g. Aura Orchestration Engine" oninput="updateListValue('projects', ${index}, 'title', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Technologies Used</label>
                        <input type="text" value="${item.tech || ''}" placeholder="e.g. Go, Kubernetes, gRPC" oninput="updateListValue('projects', ${index}, 'tech', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Project Link / URL</label>
                        <input type="text" value="${item.link || ''}" placeholder="e.g. github.com/username/project" oninput="updateListValue('projects', ${index}, 'link', this.value)">
                    </div>
                    <div class="form-group col-span-2">
                        <label>Project Description</label>
                        <textarea rows="3" placeholder="Describe the project goal, your role, and quantitative outcomes..." oninput="updateListValue('projects', ${index}, 'description', this.value)">${item.description || ''}</textarea>
                    </div>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="card-entry-header">
                <span class="card-entry-title">${cardTitle}</span>
                <button class="btn-remove-card" onclick="removeListEntry('${section}', ${index})" title="Remove item">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
            ${formFieldsHTML}
        `;
        
        container.appendChild(card);
    });
    
    lucide.createIcons();
}

// Update specific list value on keystroke
function updateListValue(section, index, key, value) {
    resumeData[section][index][key] = value;
    saveDataAndRefresh(false); // Update preview but do not rebuild editor inputs to prevent cursor jumping
}

// Add list card entry
function addListEntry(section) {
    let newItem = {};
    if (section === 'experience') {
        newItem = { company: "", position: "", startDate: "", endDate: "", description: "" };
    } else if (section === 'education') {
        newItem = { institution: "", degree: "", field: "", gradYear: "", gpa: "" };
    } else if (section === 'projects') {
        newItem = { title: "", tech: "", link: "", description: "" };
    }
    
    resumeData[section].push(newItem);
    saveDataAndRefresh(true); // Complete rebuild of forms
}

// Remove list card entry
function removeListEntry(section, index) {
    resumeData[section].splice(index, 1);
    saveDataAndRefresh(true); // Complete rebuild of forms
}

// ==========================================
// SKILLS, LANGUAGES & CERTIFICATIONS
// ==========================================

// Skills Form Editor Renderer
function renderSkillsForm() {
    const container = document.getElementById("skills-categories-container");
    container.innerHTML = "";
    
    resumeData.skills.forEach((skill, index) => {
        const row = document.createElement("div");
        row.className = "skill-cat-row";
        row.innerHTML = `
            <div class="form-group">
                <input type="text" value="${skill.category}" placeholder="e.g. Frontend" oninput="updateSkillValue(${index}, 'category', this.value)">
            </div>
            <div class="form-group">
                <input type="text" value="${skill.items}" placeholder="e.g. HTML, CSS, React" oninput="updateSkillValue(${index}, 'items', this.value)">
            </div>
            <button class="btn-remove-card mt-auto" onclick="removeSkillCategory(${index})" title="Delete Category" style="margin-bottom: 0.5rem;">
                <i data-lucide="x"></i>
            </button>
        `;
        container.appendChild(row);
    });
    lucide.createIcons();
}

function updateSkillValue(index, key, value) {
    resumeData.skills[index][key] = value;
    saveDataAndRefresh(false);
}

function addSkillCategory() {
    resumeData.skills.push({ category: "New Category", items: "" });
    saveDataAndRefresh(true);
}

function removeSkillCategory(index) {
    resumeData.skills.splice(index, 1);
    saveDataAndRefresh(true);
}

// Languages Form Editor Renderer
function renderLanguagesForm() {
    const container = document.getElementById("languages-container");
    container.innerHTML = "";
    
    resumeData.languages.forEach((lang, index) => {
        const row = document.createElement("div");
        row.className = "lang-row";
        row.innerHTML = `
            <div class="form-group">
                <input type="text" value="${lang.name}" placeholder="e.g. English" oninput="updateLanguageValue(${index}, 'name', this.value)">
            </div>
            <div class="form-group">
                <input type="text" value="${lang.level}" placeholder="e.g. Fluent" oninput="updateLanguageValue(${index}, 'level', this.value)">
            </div>
            <button class="btn-remove-card mt-auto" onclick="removeLanguageEntry(${index})" title="Delete Language" style="margin-bottom: 0.5rem;">
                <i data-lucide="x"></i>
            </button>
        `;
        container.appendChild(row);
    });
    lucide.createIcons();
}

function updateLanguageValue(index, key, value) {
    resumeData.languages[index][key] = value;
    saveDataAndRefresh(false);
}

function addLanguageEntry() {
    resumeData.languages.push({ name: "", level: "" });
    saveDataAndRefresh(true);
}

function removeLanguageEntry(index) {
    resumeData.languages.splice(index, 1);
    saveDataAndRefresh(true);
}

// Certifications Form Editor Renderer
function renderCertificationsForm() {
    const container = document.getElementById("certifications-container");
    container.innerHTML = "";
    
    resumeData.certifications.forEach((cert, index) => {
        const row = document.createElement("div");
        row.className = "cert-row";
        row.innerHTML = `
            <div class="form-group">
                <input type="text" value="${cert.name}" placeholder="e.g. AWS Certified Developer" oninput="updateCertificationValue(${index}, 'name', this.value)">
            </div>
            <div class="form-group">
                <input type="text" value="${cert.authority}" placeholder="e.g. Amazon Web Services (2024)" oninput="updateCertificationValue(${index}, 'authority', this.value)">
            </div>
            <button class="btn-remove-card mt-auto" onclick="removeCertificationEntry(${index})" title="Delete Certificate" style="margin-bottom: 0.5rem;">
                <i data-lucide="x"></i>
            </button>
        `;
        container.appendChild(row);
    });
    lucide.createIcons();
}

function updateCertificationValue(index, key, value) {
    resumeData.certifications[index][key] = value;
    saveDataAndRefresh(false);
}

function addCertificationEntry() {
    resumeData.certifications.push({ name: "", authority: "" });
    saveDataAndRefresh(true);
}

function removeCertificationEntry(index) {
    resumeData.certifications.splice(index, 1);
    saveDataAndRefresh(true);
}

// ==========================================
// RESUME RE-RENDERING & TEMPLATES COMPILES
// ==========================================

// Main Redraw Manager
function saveDataAndRefresh(rebuildForms = false) {
    // Save state
    localStorage.setItem("antigravity_resume_data", JSON.stringify(resumeData));
    
    if (rebuildForms) {
        initEditorForms();
    }
    
    renderResumePreview();
}

// Render dynamic html templates based on user active template
function renderResumePreview() {
    const container = document.getElementById("resume-preview-page");
    
    // Switch styling class
    container.className = `a4-page template-${activeTemplate}`;
    
    if (activeTemplate === 'minimal') {
        container.innerHTML = compileMinimalTemplateHTML();
    } else {
        container.innerHTML = compileModernTemplateHTML();
    }
    
    // Instantiate lucide icons in the generated content
    lucide.createIcons();
}

// Template 1: Minimalist (B&W Serif layout)
function compileMinimalTemplateHTML() {
    const p = resumeData.personal;
    
    // Header block contacts line
    let contacts = [];
    if (p.email) contacts.push(`<span><i data-lucide="mail" style="width:11px;height:11px;"></i> ${p.email}</span>`);
    if (p.phone) contacts.push(`<span><i data-lucide="phone" style="width:11px;height:11px;"></i> ${p.phone}</span>`);
    if (p.location) contacts.push(`<span><i data-lucide="map-pin" style="width:11px;height:11px;"></i> ${p.location}</span>`);
    if (p.website) contacts.push(`<span><i data-lucide="globe" style="width:11px;height:11px;"></i> <a href="https://${p.website}" target="_blank">${p.website}</a></span>`);
    if (p.linkedin) contacts.push(`<span><i data-lucide="linkedin" style="width:11px;height:11px;"></i> <a href="https://${p.linkedin}" target="_blank">LinkedIn</a></span>`);
    if (p.github) contacts.push(`<span><i data-lucide="github" style="width:11px;height:11px;"></i> <a href="https://${p.github}" target="_blank">GitHub</a></span>`);
    
    const contactsHTML = contacts.length > 0 ? `<div class="contact-row">${contacts.join("")}</div>` : '';
    
    // Summary
    const summaryHTML = p.summary ? `
        <div class="resume-section">
            <div class="section-header">Summary</div>
            <div class="summary-text">${p.summary}</div>
        </div>
    ` : '';
    
    // Work Experience
    let experienceHTML = '';
    if (resumeData.experience && resumeData.experience.length > 0) {
        const items = resumeData.experience.map(item => {
            const descFormatted = item.description ? 
                `<div class="item-desc">${item.description.split('\n').map(line => `<p>${line}</p>`).join("")}</div>` : '';
            return `
                <div class="resume-item">
                    <div class="item-header">
                        <div>
                            <span class="item-title">${item.position || ''}</span>
                            <span class="item-meta">at ${item.company || ''}</span>
                        </div>
                        <div class="item-date">${item.startDate || ''} – ${item.endDate || ''}</div>
                    </div>
                    ${descFormatted}
                </div>
            `;
        }).join("");
        experienceHTML = `
            <div class="resume-section">
                <div class="section-header">Experience</div>
                ${items}
            </div>
        `;
    }

    // Education
    let educationHTML = '';
    if (resumeData.education && resumeData.education.length > 0) {
        const items = resumeData.education.map(item => {
            return `
                <div class="resume-item">
                    <div class="item-header">
                        <div>
                            <span class="item-title">${item.degree || ''} ${item.field ? `in ${item.field}` : ''}</span>
                            <span class="item-meta">, ${item.institution || ''}</span>
                        </div>
                        <div class="item-date">${item.gradYear || ''}</div>
                    </div>
                    ${item.gpa ? `<div class="item-desc" style="padding-left:0; margin-top:0.05rem;">Grade: ${item.gpa}</div>` : ''}
                </div>
            `;
        }).join("");
        educationHTML = `
            <div class="resume-section">
                <div class="section-header">Education</div>
                ${items}
            </div>
        `;
    }

    // Projects
    let projectsHTML = '';
    if (resumeData.projects && resumeData.projects.length > 0) {
        const items = resumeData.projects.map(item => {
            const descFormatted = item.description ? 
                `<div class="item-desc" style="padding-left:0;">${item.description.split('\n').map(line => `<p>${line}</p>`).join("")}</div>` : '';
            return `
                <div class="resume-item">
                    <div class="item-header">
                        <div>
                            <span class="item-title">${item.title || ''}</span>
                            ${item.tech ? `<span class="item-meta">(${item.tech})</span>` : ''}
                        </div>
                        ${item.link ? `<div class="item-date"><a href="https://${item.link}" target="_blank" style="text-decoration: underline;">Link</a></div>` : ''}
                    </div>
                    ${descFormatted}
                </div>
            `;
        }).join("");
        projectsHTML = `
            <div class="resume-section">
                <div class="section-header">Projects</div>
                ${items}
            </div>
        `;
    }

    // Skills
    let skillsHTML = '';
    if (resumeData.skills && resumeData.skills.length > 0) {
        const rows = resumeData.skills.map(skill => {
            return `
                <div class="skills-row">
                    <span class="skills-label">${skill.category}:</span> ${skill.items}
                </div>
            `;
        }).join("");
        skillsHTML = `
            <div class="resume-section">
                <div class="section-header">Skills</div>
                <div class="skills-grid">${rows}</div>
            </div>
        `;
    }

    // Languages & Certifications (Combined horizontally in Minimal template for vertical efficiency)
    let miscHTML = '';
    let languagesBlock = '';
    let certificationsBlock = '';

    if (resumeData.languages && resumeData.languages.length > 0) {
        const items = resumeData.languages.map(lang => `${lang.name} (${lang.level})`).join(", ");
        languagesBlock = `
            <div>
                <div class="section-header">Languages</div>
                <div style="font-size: 0.78rem;">${items}</div>
            </div>
        `;
    }

    if (resumeData.certifications && resumeData.certifications.length > 0) {
        const items = resumeData.certifications.map(cert => `
            <div style="margin-bottom: 0.2rem;">
                <strong>${cert.name}</strong> - <span style="color:#444;">${cert.authority}</span>
            </div>
        `).join("");
        certificationsBlock = `
            <div>
                <div class="section-header">Certifications</div>
                <div style="font-size: 0.75rem; line-height:1.35;">${items}</div>
            </div>
        `;
    }

    if (languagesBlock || certificationsBlock) {
        miscHTML = `
            <div class="resume-section misc-grid-minimal">
                ${languagesBlock}
                ${certificationsBlock}
            </div>
        `;
    }

    return `
        <div class="resume-header">
            <h1>${p.fullName || 'Name Placeholder'}</h1>
            <div class="job-title">${p.jobTitle || 'Title Placeholder'}</div>
            ${contactsHTML}
        </div>
        ${summaryHTML}
        ${experienceHTML}
        ${educationHTML}
        ${projectsHTML}
        ${skillsHTML}
        ${miscHTML}
    `;
}

// Template 2: Modern Creative (Two-Column Colored layout)
function compileModernTemplateHTML() {
    const p = resumeData.personal;
    
    // Sidebar contacts list
    let contactsHTML = '';
    let contacts = [];
    if (p.email) contacts.push(`<div class="sidebar-contact-item"><i data-lucide="mail"></i> <span>${p.email}</span></div>`);
    if (p.phone) contacts.push(`<div class="sidebar-contact-item"><i data-lucide="phone"></i> <span>${p.phone}</span></div>`);
    if (p.location) contacts.push(`<div class="sidebar-contact-item"><i data-lucide="map-pin"></i> <span>${p.location}</span></div>`);
    if (p.website) contacts.push(`<div class="sidebar-contact-item"><i data-lucide="globe"></i> <span><a href="https://${p.website}" target="_blank">${p.website}</a></span></div>`);
    if (p.linkedin) contacts.push(`<div class="sidebar-contact-item"><i data-lucide="linkedin"></i> <span><a href="https://${p.linkedin}" target="_blank">LinkedIn</a></span></div>`);
    if (p.github) contacts.push(`<div class="sidebar-contact-item"><i data-lucide="github"></i> <span><a href="https://${p.github}" target="_blank">GitHub</a></span></div>`);
    
    if (contacts.length > 0) {
        contactsHTML = `
            <div class="sidebar-section">
                <div class="sidebar-section-title">Contact Details</div>
                <div class="sidebar-contact-list">${contacts.join("")}</div>
            </div>
        `;
    }

    // Sidebar Skills (Badge Layout)
    let skillsHTML = '';
    if (resumeData.skills && resumeData.skills.length > 0) {
        const categories = resumeData.skills.map(skill => {
            const badges = skill.items.split(',')
                .map(item => item.trim())
                .filter(item => item.length > 0)
                .map(item => `<span class="skill-badge">${item}</span>`)
                .join("");
            return `
                <div class="sidebar-skills-cat">
                    <div class="sidebar-skills-cat-title">${skill.category}</div>
                    <div class="skills-badges-wrap">${badges}</div>
                </div>
            `;
        }).join("");
        
        skillsHTML = `
            <div class="sidebar-section">
                <div class="sidebar-section-title">Core Skills</div>
                ${categories}
            </div>
        `;
    }

    // Sidebar Education
    let educationHTML = '';
    if (resumeData.education && resumeData.education.length > 0) {
        const items = resumeData.education.map(item => {
            return `
                <div class="sidebar-edu-item">
                    <div class="sidebar-edu-degree">${item.degree || ''}</div>
                    ${item.field ? `<div class="sidebar-edu-school" style="color:#38bdf8;">${item.field}</div>` : ''}
                    <div class="sidebar-edu-school">${item.institution || ''}</div>
                    <div class="sidebar-edu-date">${item.gradYear || ''} ${item.gpa ? `• ${item.gpa}` : ''}</div>
                </div>
            `;
        }).join("");
        educationHTML = `
            <div class="sidebar-section">
                <div class="sidebar-section-title">Education</div>
                ${items}
            </div>
        `;
    }

    // Sidebar Languages
    let languagesHTML = '';
    if (resumeData.languages && resumeData.languages.length > 0) {
        const items = resumeData.languages.map(lang => {
            return `
                <div class="lang-item">
                    <span class="lang-name">${lang.name}</span>
                    <span class="lang-level">${lang.level}</span>
                </div>
            `;
        }).join("");
        languagesHTML = `
            <div class="sidebar-section">
                <div class="sidebar-section-title">Languages</div>
                ${items}
            </div>
        `;
    }

    // Sidebar Certifications
    let certificationsHTML = '';
    if (resumeData.certifications && resumeData.certifications.length > 0) {
        const items = resumeData.certifications.map(cert => {
            return `
                <div class="cert-item">
                    <div class="cert-name">${cert.name}</div>
                    <div class="cert-org">${cert.authority}</div>
                </div>
            `;
        }).join("");
        certificationsHTML = `
            <div class="sidebar-section">
                <div class="sidebar-section-title">Certifications</div>
                ${items}
            </div>
        `;
    }

    // Sidebar compilation
    const sidebarHTML = `
        <aside class="sidebar">
            ${contactsHTML}
            ${skillsHTML}
            ${educationHTML}
            ${languagesHTML}
            ${certificationsHTML}
        </aside>
    `;

    // Right side: Summary
    const summaryHTML = p.summary ? `
        <div class="main-section">
            <h2 class="main-section-title"><i data-lucide="user-check"></i> Summary</h2>
            <div class="summary-text">${p.summary}</div>
        </div>
    ` : '';

    // Right side: Work Experience (Timeline)
    let experienceHTML = '';
    if (resumeData.experience && resumeData.experience.length > 0) {
        const items = resumeData.experience.map(item => {
            const descFormatted = item.description ? 
                `<div class="item-desc">${item.description.split('\n').map(line => `<p>${line}</p>`).join("")}</div>` : '';
            return `
                <div class="timeline-item">
                    <div class="timeline-bullet"></div>
                    <div class="item-header">
                        <div>
                            <span class="item-title">${item.position || ''}</span>
                            <span class="item-meta">at ${item.company || ''}</span>
                        </div>
                        <div class="item-date">${item.startDate || ''} – ${item.endDate || ''}</div>
                    </div>
                    ${descFormatted}
                </div>
            `;
        }).join("");
        experienceHTML = `
            <div class="main-section">
                <h2 class="main-section-title"><i data-lucide="briefcase"></i> Experience</h2>
                <div class="timeline-list">${items}</div>
            </div>
        `;
    }

    // Right side: Projects
    let projectsHTML = '';
    if (resumeData.projects && resumeData.projects.length > 0) {
        const items = resumeData.projects.map(item => {
            const descFormatted = item.description ? 
                `<div class="item-desc">${item.description.split('\n').map(line => `<p>${line}</p>`).join("")}</div>` : '';
            return `
                <div class="project-item">
                    <div class="project-header">
                        <div class="project-title-row">
                            <span class="project-title">${item.title || ''}</span>
                            ${item.tech ? `<span class="project-tech">${item.tech}</span>` : ''}
                        </div>
                        ${item.link ? `<a href="https://${item.link}" target="_blank" class="project-link">Website</a>` : ''}
                    </div>
                    ${descFormatted}
                </div>
            `;
        }).join("");
        projectsHTML = `
            <div class="main-section">
                <h2 class="main-section-title"><i data-lucide="folder-git-2"></i> Key Projects</h2>
                ${items}
            </div>
        `;
    }

    // Right side main content compilation
    const mainContentHTML = `
        <div class="main-content">
            <header class="header-block">
                <div class="name-title">
                    <h1>${p.fullName || 'Name Placeholder'}</h1>
                    <div class="job-title">${p.jobTitle || 'Title Placeholder'}</div>
                </div>
            </header>
            ${summaryHTML}
            ${experienceHTML}
            ${projectsHTML}
        </div>
    `;

    return `
        ${sidebarHTML}
        ${mainContentHTML}
    `;
}

// ==========================================
// TEMPLATE SELECTION
// ==========================================
function selectTemplate(templateName) {
    activeTemplate = templateName;
    localStorage.setItem("antigravity_resume_template", templateName);
    
    // Toggle active template headers buttons
    const btnModern = document.getElementById("btn-template-modern");
    const btnMinimal = document.getElementById("btn-template-minimal");
    
    if (templateName === 'modern') {
        btnModern.classList.add("active");
        btnMinimal.classList.remove("active");
    } else {
        btnModern.classList.remove("active");
        btnMinimal.classList.add("active");
    }
    
    renderResumePreview();
    lucide.createIcons();
}

// ==========================================
// ZOOM AND FIT VIEWPORT ENGINE
// ==========================================
function updateZoomUI() {
    const pageWrapper = document.getElementById("a4-page-wrapper");
    pageWrapper.style.transform = `scale(${zoomScale / 100})`;
    document.getElementById("zoom-value").innerText = `${zoomScale}%`;
}

function adjustZoom(amount) {
    zoomScale = Math.min(Math.max(zoomScale + amount, 30), 150);
    updateZoomUI();
}

function resetZoom() {
    zoomScale = 100;
    updateZoomUI();
}

function autoFitZoom() {
    const viewport = document.getElementById("preview-viewport");
    if (!viewport) return;
    
    const viewportHeight = viewport.clientHeight;
    const a4BaseHeight = 1122; // approx height of A4 container in pixels at 96 DPI
    
    // Compute optimal scale, leaving 40px margins
    const targetScale = Math.floor(((viewportHeight - 60) / a4BaseHeight) * 100);
    
    // Bound the auto-zoom between 40% and 125%
    zoomScale = Math.min(Math.max(targetScale, 40), 125);
    updateZoomUI();
}

// ==========================================
// DATA RESET / CLEAR
// ==========================================
function resetResumeData() {
    if (confirm("Are you sure you want to clear your current resume details? This cannot be undone.")) {
        resumeData = {
            personal: { fullName: "", jobTitle: "", email: "", phone: "", location: "", website: "", linkedin: "", github: "", summary: "" },
            experience: [],
            education: [],
            projects: [],
            skills: [{ category: "Skills", items: "" }],
            languages: [],
            certifications: []
        };
        saveDataAndRefresh(true);
    }
}

// ==========================================
// IMPORT & EXPORT HANDLERS (JSON Data Portability)
// ==========================================
function triggerJsonImport() {
    document.getElementById("json-file-input").click();
}

function importJsonData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            // Quick schema validation
            if (parsed && typeof parsed === 'object' && parsed.personal) {
                resumeData = parsed;
                saveDataAndRefresh(true);
                alert("Resume data successfully imported!");
            } else {
                throw new Error("Invalid schema structure. Must contain a personal details object.");
            }
        } catch (err) {
            alert("Error parsing JSON file. Please ensure it is a valid resume export file: " + err.message);
        }
    };
    reader.readAsText(file);
    // Reset file input value so user can upload same file again if desired
    event.target.value = "";
}

function exportJsonData() {
    const dataStr = JSON.stringify(resumeData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const name = resumeData.personal.fullName ? resumeData.personal.fullName.replace(/\s+/g, '_') : 'Resume';
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name}_data.json`;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ==========================================
// PDF GENERATION & NATIVE PRINT TRIGGERS
// ==========================================

// Method 1: Direct File Download via html2pdf.js
function generatePDF() {
    const element = document.getElementById("resume-preview-page");
    const name = resumeData.personal.fullName ? resumeData.personal.fullName.replace(/\s+/g, '_') : 'Resume';
    
    // Momentarily force scaling wrapper to 100% (scale 1) to prevent html2pdf capturing scaled coordinates
    const originalTransform = document.getElementById("a4-page-wrapper").style.transform;
    document.getElementById("a4-page-wrapper").style.transform = "scale(1)";
    
    const opt = {
        margin: 0,
        filename: `${name}_Resume.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2.5, // High resolution canvas capture
            useCORS: true,
            letterRendering: true,
            logging: false
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' 
        }
    };
    
    // Setup temporary export configuration classes if needed
    html2pdf().set(opt).from(element).save().then(() => {
        // Restore zoom layout back to the viewport setting
        document.getElementById("a4-page-wrapper").style.transform = originalTransform;
    }).catch(err => {
        console.error("PDF generation failed", err);
        // Restore scale in case of crash
        document.getElementById("a4-page-wrapper").style.transform = originalTransform;
    });
}

// Method 2: System Printing Interface (High fidelity browser print to PDF vector output)
function triggerPrint() {
    window.print();
}
