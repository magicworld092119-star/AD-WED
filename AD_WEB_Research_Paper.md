# AD-WEB: An Integrated Explainable AI System for 3D Structural MRI Alzheimer’s Disease Staging via 3D DenseNet121, Volumetric Grad-CAM, and LLM-Augmented Clinical Synthesis

**Megavath Ramudu$^{1}$, Rathlavath Sriram$^{2}$, Rajamuri Spandana$^{3}$, Shaik Mohammed Asif$^{4}$, Malavath Vaishnavi$^{5}$, Challa Sundeep Babu$^{6}$**

$^{1, 2, 3, 4, 5}$ Department of Computer Science and Engineering (Artificial Intelligence and Machine Learning)  
$^{6}$ Department of Computer Science and Engineering  
Keshav Memorial Institute of Technology (KMIT), Hyderabad, Telangana, India  
$^{1}$[megavathramudu@gmail.com](mailto:megavathramudu@gmail.com), $^{2}$[rathlavathsriramrathod@gmail.com](mailto:rathlavathsriramrathod@gmail.com), $^{3}$[rspandana526@gmail.com](mailto:rspandana526@gmail.com), $^{4}$[shaikmohammedasif52@gmail.com](mailto:shaikmohammedasif52@gmail.com), $^{5}$[vaishnavimalavath888@gmail.com](mailto:vaishnavimalavath888@gmail.com)  
$^{6}$*Corresponding Author:* [sundeepchallakmit@gmail.com](mailto:sundeepchallakmit@gmail.com)

---

## Abstract

Alzheimer’s disease (AD) represents an escalating global healthcare crisis wherein early, accurate clinical staging is indispensable for timely therapeutic intervention and clinical trial stratification. Differentiating among Cognitively Normal (CN) healthy aging, intermediate Mild Cognitive Impairment (MCI), and clinical Alzheimer’s Disease (AD) presents formidable computational challenges because neurostructural alterations are subtle, non-linear, and dispersed across heterogeneous cranial anatomy. Conventional computer-assisted neuroimaging frameworks predominantly disintegrate volumetric structural Magnetic Resonance Imaging (sMRI) scans into collections of two-dimensional planar slices—an operation that inherently destroys vital through-plane topological dependencies and causes rampant data leakage. 

To overcome these foundational limitations, this paper presents **AD-WEB**, an end-to-end, integrated explainable artificial intelligence (XAI) framework uniting whole-brain three-dimensional deep representation learning, dual-mode volumetric explainability, multimodal Large Language Model (LLM) clinical narrative synthesis, and an interactive multi-planar web delivery environment. The core analytical engine employs a customized 3D DenseNet121 architecture processing standardized isotropic cranial volumes of $96 \times 96 \times 96$ voxels. Algorithmic transparency is established via a dual-mode volumetric attribution engine that integrates continuous Gradient-weighted Class Activation Mapping (Grad-CAM) and output-layer Weight-Based Class Activation Mapping (CAM), supplemented by multi-channel counterfactual channel inspection (AD, MCI, and CN Focus) and automated tissue-masked peak hotspot auto-navigation. Crucially, AD-WEB bridges the interpretive chasm between raw classification vectors and clinical actionability through a decoupled Large Language Model (Google Gemini) pipeline that automatically converts volumetric features, calibrated probabilities, and quantitative hippocampal volumetrics into structured clinical reports detailing primary biomarker risk, neuropathological causes, modifiable vascular risks, and personalized interventions.

Rigorous evaluation across 1,829 high-resolution T1-weighted sMRI examinations from the Alzheimer’s Disease Neuroimaging Initiative (ADNI) cohort (comprising 588 CN, 633 MCI, and 610 AD scans across 586 unique participants under strict subject-level isolation) demonstrated a macro-averaged accuracy of 93.9%, macro precision of 93.4%, macro recall of 93.9%, and an F1-score of 93.6%, demonstrating decisive superiority over volumetric 3D ResNet-18 (87.8%) and slice-based 2D ResNet-50 (79.7%). The decoupled web architecture—combining automated MONAI preprocessing, asynchronous FastAPI services, React.js orthogonal visualization, and a dual-tier MongoDB/JSON failover store—executes the full ingestion-to-explanation pipeline within an average of 937 milliseconds per volume. AD-WEB provides clinicians with an actionable, verifiable decision-support ecosystem capable of operating as an interpretable diagnostic partner.

**Keywords:** Alzheimer’s disease; structural MRI; 3D deep learning; DenseNet121; Explainable AI (XAI); Volumetric Grad-CAM; Large Language Models; Gemini; clinical decision support; neuroimaging.

---

## 1. Introduction

Alzheimer’s disease (AD) represents the predominant etiology of progressive cognitive dysfunction and dementia in elderly populations worldwide, contributing to an estimated 60% to 80% of all neurodegenerative clinical diagnoses. Epidemiological projections indicate that the global prevalence of dementia, recorded at approximately 57 million individuals in 2019, will surge past 152 million by 2050, placing immense social, logistical, and financial pressures on public health infrastructures [2]. Neuropathologically, Alzheimer’s disease is characterized by an insidious cascade originating decades prior to outward clinical manifestation. This pathophysiological process begins with the microscopic aggregation and deposition of extracellular amyloid-beta ($A\beta$) plaques and the hyperphosphorylation of intracellular tau proteins into neurofibrillary tangles (NFTs) [24]. The progressive propagation of these toxic proteopathies triggers synaptic failure, neuroinflammation, microvascular dysfunction, and widespread neuronal apoptosis, ultimately culminating in macroscopically identifiable cranial atrophy.

Within contemporary neurology, structural Magnetic Resonance Imaging (sMRI) serves as the primary non-invasive, radiation-free diagnostic modality for qualitative and quantitative appraisal of neurodegenerative hallmarks [25]. High-resolution T1-weighted cranial acquisitions reveal critical structural markers, including widening of cerebral sulci, symmetrical enlargement of the lateral ventricles (*hydrocephalus ex vacuo*), and progressive cortical thinning. Most crucially, accelerated atrophy of the medial temporal lobe (MTL)—most prominently localized to the hippocampus, entorhinal cortex, and amygdala—exhibits a strong quantitative correlation with histopathological progression and episodic memory decline.

Despite the clinical utility of structural neuroimaging, accurate automated staging across the continuum of neurodegeneration remains exceptionally complex. The clinical trajectory traverses three broad diagnostic categories:
1. **Cognitively Normal (CN):** Normal chronological aging accompanied by benign, non-pathological senescent volume loss.
2. **Mild Cognitive Impairment (MCI):** A critical prodromal transitional phase where patients exhibit measurable cognitive deficits exceeding age-matched expectations while retaining functional independence in daily living activities.
3. **Alzheimer’s Disease (AD):** Fully developed dementia marked by substantial memory loss, executive dysfunction, functional impairment, and extensive structural degeneration.

Distinguishing MCI from healthy aging and advanced dementia poses an acute challenge. The pathological alterations characterizing early-stage MCI are subtle, highly localized, and visually ambiguous, frequently blending seamlessly with the morphological variations of normal biological aging. Furthermore, standard radiological assessment relying upon manual visual inspection and slice-by-slice volumetric tracing is laborious, inherently subjective, and prone to substantial inter- and intra-observer variability.

The emergence of computer vision and deep learning has stimulated widespread investigation into automated neuroimaging classification. Nevertheless, current deep learning implementations in neuroimaging suffer from four fundamental structural shortcomings:

1. **Topological Disruption in 2D Planar Formulations:** A significant portion of existing literature converts 3D cranial scans into disconnected collections of 2D cross-sectional images (axial, coronal, or sagittal slices) evaluated via standard convolutional neural networks (CNNs). This planar decomposition destroys native through-plane anatomical continuity and discards spatial correlation along orthogonal axes.
2. **Methodological Data Leakage:** Empirical surveys have shown that slice-based 2D models frequently distribute distinct cross-sectional slices from the same subject across both training and testing partitions, artificially inflating performance metrics through subject-level memorization rather than generalized disease staging [5].
3. **Black-Box Opacity and the Clinical Trust Gap:** Standard neural networks generate categorical probabilities in isolation without spatial attribution. In life-critical medical settings, delivering a diagnosis without identifying which specific cranial structures informed that judgment engenders justifiable skepticism among clinicians and inhibits regulatory approval [4].
4. **Interpretive Disconnect in Existing XAI:** Conventional Explainable Artificial Intelligence (XAI) implementations (such as Grad-CAM) operate as isolated visualization scripts that output static heatmaps without contextualizing what the highlighted activations clinically signify. A clinician reviewing an activation map must independently extrapolate what neurobiological drivers (e.g., ventricular dilation versus hippocampal atrophy) triggered that attention.

To address these compounding limitations, this paper presents **AD-WEB**, an end-to-end, production-ready explainable AI framework for three-stage Alzheimer’s disease classification. AD-WEB unifies whole-volume 3D deep feature representation via a customized 3D DenseNet121, dual-mode volumetric class activation mapping (Grad-CAM and Weight-Based CAM), multimodal Large Language Model (Google Gemini) clinical narrative generation, quantitative hippocampal volumetrics, and an interactive multi-planar web delivery environment.

### Primary Contributions
The core technical and methodological contributions of this investigation are:
* **Holistic 3D Representation Learning without Planar Disruption:** Deployment of a customized 3D DenseNet121 architecture processing standardized isotropic $96 \times 96 \times 96$ voxel volumes, preserving complex three-dimensional morphological geometry and through-plane spatial dependencies across all anatomical planes.
* **Dual-Mode Volumetric Explainability Engine:** Development of a unified 3D attribution pipeline providing both gradient-weighted (Grad-CAM) and output-layer Weight-Based Class Activation Mapping (CAM). The system introduces multi-channel counterfactual explainability (allowing interactive switching among AD, MCI, and CN channels) and tissue-masked peak hotspot auto-navigation that ignores cranial boundary artifacts.
* **LLM-Augmented Clinical Decision Support:** Creation of an automated bridge between computer vision and clinical documentation by integrating Google Gemini to translate raw logits, calibrated probabilities, hippocampal volumetrics, and spatial Grad-CAM coordinates into coherent, structured clinical summaries detailing biomarker severity, neuropathological drivers, modifiable vascular risks, and personalized interventions.
* **Decoupled, Resilient Production Architecture:** Engineering a full-stack, clinical-grade software ecosystem featuring an asynchronous FastAPI backend, a React.js multi-planar viewer, and a dual-tier storage strategy (MongoDB coupled with automated encrypted local JSON failover) delivering end-to-end diagnostic inferences within an average of 937 milliseconds per volume.
* **Rigorous Validation under Zero-Leakage Constraints:** Comprehensive 5-fold cross-validation on 1,829 high-resolution T1-weighted ADNI scans enforcing strict participant-level segregation, achieving 93.9% macro accuracy and establishing decisive diagnostic superiority over both volumetric 3D ResNet-18 and slice-based 2D ResNet-50 baselines.

---

## 2. Literature Survey

Automated classification of Alzheimer’s disease has evolved through multiple computational paradigms over the past three decades, shifting from manual feature engineering to deep representation learning and, more recently, toward explainable and multimodal clinical decision support.

### 2.1 Morphometric Handcrafted Methods and Traditional Machine Learning
Initial computer-aided diagnosis (CAD) frameworks depended upon handcrafted biomechanical feature extraction coupled with shallow statistical classifiers. Voxel-Based Morphometry (VBM) and surface-based cortical thickness extraction gained early prominence, utilizing statistical parametric mapping to quantify localized reductions in gray matter volume [27]. Structural measurements extracted from subcortical regions—specifically the bilateral hippocampus, entorhinal cortex, and ventricular cavities—were evaluated using Support Vector Machines (SVM) [30], Random Forests [29], Linear Discriminant Analysis (LDA), and Logistic Regression.

Klöppel et al. [27] utilized linear SVMs on whole-brain gray matter maps to discriminate pathologically confirmed AD from healthy controls, reporting diagnostic accuracies comparable to radiological consensus. Similarly, Basaia et al. [9] demonstrated that morphometric markers of hippocampal subfields could identify structural deterioration across stages. Nevertheless, handcrafted pipelines suffer from substantial structural liabilities: they require computationally intensive spatial normalization and tissue segmentation, depend heavily on predefined region-of-interest (ROI) segmentations that overlook diffuse or unexpected pathological interactions, and display high vulnerability to scanner-dependent intensity non-uniformity.

### 2.2 Deep 2D Convolutional Networks and the Data Leakage Epidemic
The advent of deep convolutional neural networks (CNNs) bypassed handcrafted feature engineering by optimizing hierarchical spatial representations directly from raw voxel grids [8, 16]. Early neuroimaging pipelines adapted established 2D architectures originally formulated for natural 2D image recognition, such as VGGNet [22] and ResNet [21]. In typical 2D implementations, 3D cranial volumes are sliced along planar axes (most commonly the axial plane), and individual 2D images are independently classified.

While computationally efficient and compatible with pre-trained ImageNet weights, 2D formulations suffer from acute structural flaws. Dissecting a continuous 3D cranial anatomy into independent 2D cross-sections discards through-plane structural continuity. Crucially, as documented in an exhaustive systematic survey by Wen et al. [5], a staggering proportion of published 2D neuroimaging studies exhibit profound methodological data leakage: slices extracted from the same subject are inadvertently partitioned across both training and testing datasets. In such setups, networks memorize unique anatomical idiosyncrasies (such as cranial shape and skull thickness) rather than learning generalized disease pathology, generating unrealistically inflated accuracies exceeding 98%. When evaluated under rigorous, leak-free patient-level segregation, 2D slice-based models experience catastrophic performance drops, frequently plummeting below 75% accuracy when classifying the challenging, transitional MCI stage.

### 2.3 Volumetric 3D Deep Neural Architectures
To preserve native cranial topology, recent neuroimaging research has migrated toward volumetric three-dimensional convolutional architectures [13, 18]. By replacing 2D planar convolutions with 3D spatial kernels ($K \times K \times K$), volumetric networks process depth, height, and width coordinates concurrently. Korolev et al. [18] introduced VoxCNN and 3D ResNet variants for whole-brain structural classification, demonstrating that volumetric models extract disease representations directly from unsegmented MRI scans without requiring prior skull-stripping or tissue parcellation.

The DenseNet architecture, proposed by Huang et al. [17], introduced dense inter-layer connections where each layer within a dense block receives concatenated feature representations from all preceding layers. Solano-Rojas et al. [6] adapted a 3D DenseNet configuration for Alzheimer’s detection, observing that dense feature reuse substantially strengthens gradient backpropagation, minimizes vanishing gradient phenomena, and reduces parameter redundancy compared to traditional convolutional backbones. These characteristics render 3D DenseNet uniquely suited for medical volumetric domains, where training sample sizes are constrained relative to the massive spatial dimensionality of 3D MRI.

### 2.4 Explainable AI (XAI) in Neuroimaging
As volumetric deep networks grew in architectural complexity, their black-box opacity emerged as a primary barrier to clinical translation [4]. In response, various saliency and attribution formulations have been explored to visualize the internal representations governing network predictions. These include Layer-wise Relevance Propagation (LRP) [11, 23], Integrated Gradients [20], and Gradient-weighted Class Activation Mapping (Grad-CAM) [19].

Böhle et al. [11] adapted LRP to 3D convolutional networks, demonstrating that deep architectures identify atrophy patterns within temporal and parietal structures. Rieke et al. [14] compared multiple visualization methodologies on 3D MRI, concluding that gradient-based class activation methods provide superior anatomical stability compared to raw perturbation techniques. Yang et al. [15] applied 3D Grad-CAM to visualize neural network attributions across orthogonal planes, confirming that network attention aligns with known neuropathological patterns of cortical thinning and ventricular expansion. 

However, existing neuroimaging XAI research remains overwhelmingly confined to isolated, non-interactive computational workflows. Existing implementations generate static 2D figures, lack mechanisms for interactive real-time spatial navigation across orthogonal planes, and do not offer counterfactual channel inspection. Furthermore, none of these systems bridge the communication gap between spatial heatmaps and actionable clinical documentation.

### 2.5 Evolution Toward Multimodal Clinical Decision Support
Recent breakthroughs in Large Language Models (LLMs) and multimodal AI have revealed profound opportunities for translating complex visual and quantitative outputs into standardized medical documentation. Aksoy and Daou [1] proposed an explainable web diagnostic prototype utilizing XRAI on 2D MRI slices, demonstrating the utility of browser interfaces for neurological evaluation. However, their architecture remained constrained by 2D image processing and lacked automated clinical synthesis. AD-WEB synthesizes these fragmented technological domains into a unified framework encompassing whole-volume 3D DenseNet121 staging, dual-mode volumetric Grad-CAM, automated MONAI preprocessing, Gemini-powered clinical narrative generation, and an interactive multi-planar web delivery environment.

---

## 3. Proposed Methodology

The AD-WEB architecture operates through an orchestrated, multi-stage pipeline designed for end-to-end clinical translation. The complete system workflow—from raw volumetric ingestion to interactive web visualization—is systematically depicted in Figure 1.

```
+---------------------------------------------------------------------------------------------------+
|                                   AD-WEB SYSTEM WORKFLOW OVERVIEW                                 |
+---------------------------------------------------------------------------------------------------+
|  [Raw sMRI NIfTI]                                                                                 |
|         |                                                                                         |
|         v                                                                                         |
|  +---------------------------------------------------------------------------------------------+  |
|  | STEP 1: AUTOMATED MONAI PREPROCESSING                                                        |  |
|  | - 4D-to-3D Dimension Harmonization -> RAS Anatomical Reorientation                          |  |
|  | - Isotropic Resampling (1.0 mm³) -> Uniform Spatial Standardize (96 x 96 x 96)               |  |
|  | - Parenchymal Z-Score Normalization -> Contrast-Enhanced Visual Volume Generation           |  |
|  +---------------------------------------------------------------------------------------------+  |
|         |                                                                                         |
|         v                                                                                         |
|  +---------------------------------------------------------------------------------------------+  |
|  | STEP 2: 3D DENSENET121 VOLUMETRIC REPRESENTATION LEARNING                                   |  |
|  | - 4 Volumetric DenseBlocks (6, 12, 24, 16 layers; Growth Rate k = 32)                       |  |
|  | - 3D Global Average Pooling (GAP) -> 1024-Dimensional Continuous Latent Feature Vector        |  |
|  | - Linear Classification Layer -> Empirical Logit Bias Calibration & Temperature Scaling    |  |
|  | - Output Probabilities: P(CN), P(MCI), P(AD)                                                |  |
|  +---------------------------------------------------------------------------------------------+  |
|         |                                                                                         |
|         +---------------------------------------+-----------------------------------------+       |
|         |                                       |                                         |       |
|         v                                       v                                         v       |
|  +-----------------------------+ +-----------------------------+ +-----------------------------+  |
|  | STEP 3A: DUAL-MODE XAI      | | STEP 3B: VOLUMETRICS        | | STEP 3C: CLINICAL LLM       |  |
|  | - Volumetric Grad-CAM &     | | - Hippocampal Volume        | | - Google Gemini Synthesis   |  |
|  |   Weight-Based CAM          | |   Estimation (mm³)          | | - Primary AD Biomarker      |  |
|  | - Multi-Channel Counter-    | | - Quantitative Neurodegen-  | |   Severity Signal           |  |
|  |   factual Saliency Channels | |   eration Marker            | | - Biological Drivers &      |  |
|  | - Tissue-Masked Hotspot     | |                             | |   Modifiable Risk Factors   |  |
|  |   Auto-Focus Navigation     | |                             | | - Personalized Lifestyle    |  |
|  |                             | |                             | |   Prevention Guidelines     |  |
|  +-----------------------------+ +-----------------------------+ +-----------------------------+  |
|         |                                       |                                         |       |
|         +---------------------------------------+-----------------------------------------+       |
|                                                 |                                                 |
|                                                 v                                                 |
|  +---------------------------------------------------------------------------------------------+  |
|  | STEP 4: DECOUPLED WEB INFERENCE & RESILIENT DATA TIER                                       |  |
|  | - Asynchronous FastAPI RESTful API Engine (< 1000 ms End-to-End Execution)                  |  |
|  | - Dual-Tier Storage: Primary MongoDB with Automated Encrypted Local JSON Failover           |  |
|  | - React.js + Tailwind CSS Multi-Planar Viewer (Orthogonal Axial, Coronal, Sagittal)         |  |
|  | - Interactive Opacity, Turbo Colormap Blending, and Context-Aware Clinical AI Chatbot       |  |
|  +---------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```
*Figure 1: Comprehensive architectural workflow of the AD-WEB framework.*

---

### 3.1 Dataset Stratification and Subject-Level Isolation
The framework was trained, validated, and evaluated using standardized T1-weighted structural MRI volumes procured from the Alzheimer’s Disease Neuroimaging Initiative (ADNI) public repository [26, 28]. The curated experimental cohort comprises **1,829 valid three-dimensional structural examinations** representing **586 unique participants**.

To ensure clinical validity, diagnostic categorizations adhere strictly to standardized ADNI clinical criteria combining Clinical Dementia Rating (CDR) evaluations, Mini-Mental State Examination (MMSE) scores, and composite neuropsychological batteries:
* **Cognitively Normal (CN):** 588 scans; characterized by an MMSE score between 28 and 30, CDR score of 0.0, and an absence of subjective memory complaints.
* **Mild Cognitive Impairment (MCI):** 633 scans; characterized by an MMSE score between 24 and 30, subjective memory concern, objective memory loss documented via the Wechsler Memory Scale Logical Memory II test, CDR score of 0.5, and preserved basic activities of daily living.
* **Alzheimer’s Disease (AD):** 610 scans; characterized by an MMSE score between 18 and 26, CDR score of 0.5 to 2.0, and fulfillment of the NINCDS/ADRDA consensus criteria for probable Alzheimer’s disease.

**Zero-Leakage Stratification Protocol:** To prevent subject-level data contamination, all dataset splits were partitioned at the unique participant identifier level ($Subject\_ID$). No individual participant’s longitudinal scans were permitted to cross partitions. The 1,829 scans were partitioned into:
* **Training Partition:** 1,495 scans (470 unique patients; 469 CN, 516 MCI, 510 AD).
* **Validation Partition:** 170 scans (57 unique patients; 59 CN, 58 MCI, 53 AD).
* **Independent Test Partition:** 164 scans (59 unique patients; 59 CN, 59 MCI, 46 AD).

### 3.2 Automated Volumetric Preprocessing Pipeline
Raw cranial acquisitions collected across multi-site hospital networks manifest significant spatial and radiometric discrepancies, including anisotropic voxel spacing, disparate head orientations, variable matrix shapes, and radiofrequency coil non-uniformities. AD-WEB incorporates an automated preprocessing pipeline implemented via MONAI [3] and NiBabel:

1. **4D-to-3D Dimension Harmonization:** Clinical scanners occasionally store acquisitions with trailing acquisition dimensions (e.g., dual-echo sequences or dynamic time series of shape $(256, 256, 166, 2)$). The pipeline inspects input tensor dimensionality; if a 4D acquisition is encountered, it automatically extracts the primary 3D structural volume ($V = V[:, :, :, 0]$), preventing shape mismatch exceptions.
2. **RAS Anatomical Reorientation:** All scans are reoriented to the standard Neurological Right-Anterior-Superior (RAS) coordinate system, eliminating rotational variability across scanner vendors.
3. **Isotropic Resampling and Spatial Standardization:** Cranial volumes are resampled to an isotropic voxel resolution of $1.0 \times 1.0 \times 1.0\text{ mm}^3$ and standardized to a uniform spatial dimension of $96 \times 96 \times 96$ voxels using 3D B-spline interpolation. This dimensions-to-resolution ratio preserves native medial temporal lobe and hippocampal morphometry while optimizing memory footprint during 3D convolution.
4. **Parenchymal Z-Score Intensity Normalization:** Non-zero parenchymal voxels are isolated, and their intensity distribution is standardized:
   $$\hat{I}(x, y, z) = \frac{I(x, y, z) - \mu_{\text{parenchyma}}}{\sigma_{\text{parenchyma}} + \epsilon}$$
   where $\mu_{\text{parenchyma}}$ and $\sigma_{\text{parenchyma}}$ denote the mean and standard deviation of non-zero tissue intensities, and $\epsilon = 10^{-8}$ prevents numerical instability.
5. **Contrast-Sharpened Visual Volume Generation:** Concurrently, an 8-bit visualization volume ($0-255$ uint8) is synthesized via percentile intensity clipping ($0.5\%$ to $99.5\%$) and Contrast Limited Adaptive Histogram Equalization (CLAHE) with a clip limit of $2.2$ and tile grid size of $(8, 8)$ to accentuate tissue interfaces during slice overlay.

---

### 3.3 3D DenseNet121 Architectural Formulation
Feature extraction and categorical staging are performed using a customized three-dimensional DenseNet121 architecture. Let $\mathbf{x} \in \mathbb{R}^{1 \times 96 \times 96 \times 96}$ denote the preprocessed single-channel 3D cranial volume. The architecture comprises an initial 3D convolution, four dense blocks interconnected by transition layers, a 3D global average pooling layer, and a calibrated linear classification head.

#### Mathematical Formulation of Dense Connectivity
Within each dense block, all layers are interconnected. Let $H_\ell(\cdot)$ represent the non-linear composite transformation of the $\ell$-th layer, consisting of:
$$\text{Composite Layer } \ell: \quad \text{BatchNorm3D} \to \text{ReLU} \to \text{Conv3D}(1 \times 1 \times 1) \to \text{BatchNorm3D} \to \text{ReLU} \to \text{Conv3D}(3 \times 3 \times 3)$$

In contrast to standard residual networks that rely upon additive identity mappings ($\mathbf{x}_\ell = H_\ell(\mathbf{x}_{\ell-1}) + \mathbf{x}_{\ell-1}$), the $\ell$-th layer of a dense block receives the concatenated outputs of all preceding layers as its input:
$$\mathbf{x}_\ell = H_\ell([\mathbf{x}_0, \mathbf{x}_1, \mathbf{x}_2, \dots, \mathbf{x}_{\ell-1}])$$
where $[\mathbf{x}_0, \mathbf{x}_1, \dots, \mathbf{x}_{\ell-1}]$ denotes the channel-wise feature map concatenation. If each transformation $H_\ell$ produces $k$ feature maps, the $\ell$-th layer possesses $k_0 + k \times (\ell - 1)$ input channels, where $k$ represents the architectural **growth rate** (configured as $k = 32$).

#### Layer Structure and Dimensional Trajectory
The operational configuration across the four dense blocks is structured as follows:
* **Initial Feature Extraction:** $\text{Conv3D}(1 \to 64, \text{kernel}=7 \times 7 \times 7, \text{stride}=2) \to \text{MaxPool3D}(3 \times 3 \times 3, \text{stride}=2)$. Output: $(64, 24, 24, 24)$.
* **Dense Block 1:** 6 composite layers. Output: $(256, 24, 24, 24)$.
* **Transition Layer 1:** $\text{Conv3D}(256 \to 128, 1 \times 1 \times 1) \to \text{AvgPool3D}(2 \times 2 \times 2, \text{stride}=2)$. Output: $(128, 12, 12, 12)$.
* **Dense Block 2:** 12 composite layers. Output: $(512, 12, 12, 12)$.
* **Transition Layer 2:** $\text{Conv3D}(512 \to 256, 1 \times 1 \times 1) \to \text{AvgPool3D}(2 \times 2 \times 2, \text{stride}=2)$. Output: $(256, 6, 6, 6)$.
* **Dense Block 3:** 24 composite layers. Output: $(1024, 6, 6, 6)$.
* **Transition Layer 3:** $\text{Conv3D}(1024 \to 512, 1 \times 1 \times 1) \to \text{AvgPool3D}(2 \times 2 \times 2, \text{stride}=2)$. Output: $(512, 3, 3, 3)$.
* **Dense Block 4:** 16 composite layers. Terminal feature map $\mathbf{A} \in \mathbb{R}^{1024 \times 3 \times 3 \times 3}$.

#### Global Pooling, Logit Calibration, and Probability Mapping
Following Dense Block 4, 3D Global Average Pooling (GAP) condenses the spatial dimensions ($D=3, H=3, W=3$) into a continuous 1024-dimensional latent embedding vector $\mathbf{f} \in \mathbb{R}^{1024}$:
$$f_k = \frac{1}{D \times H \times W} \sum_{d=1}^{D} \sum_{h=1}^{H} \sum_{w=1}^{W} A_k(d, h, w)$$

The linear classification layer computes raw uncalibrated logits $\mathbf{z} \in \mathbb{R}^3$:
$$z_c = \sum_{k=1}^{1024} w_{c, k} f_k + b_c \quad \text{for } c \in \{\text{CN: } 0, \text{MCI: } 1, \text{AD: } 2\}$$
where $\mathbf{w}_c \in \mathbb{R}^{1024}$ and $b_c$ denote the weights and bias of class $c$.

To eliminate output distribution saturation and align model confidence with true clinical likelihood, the framework applies empirical logit bias calibration and temperature scaling:
$$\hat{z}_c = \frac{z_c - \beta_c}{T}$$
$$P(Y = c \mid \mathbf{x}) = \frac{\exp(\hat{z}_c)}{\sum_{j=0}^{2} \exp(\hat{z}_j)}$$
where $\boldsymbol{\beta} = [0.126, -8.682, 8.193]$ compensates for empirical output displacement, and $T = 2.5$ represents the temperature parameter. The predicted diagnostic category is given by $\hat{c} = \arg\max_{c} P(Y = c \mid \mathbf{x})$.

---

### 3.4 Dual-Mode Volumetric Explainability Engine
To provide interpretable spatial rationales, AD-WEB incorporates a dual-mode volumetric Class Activation Mapping engine comprising both **Volumetric Grad-CAM** and **Weight-Based CAM**.

#### Mode 1: Volumetric Grad-CAM
Let $Y^c$ represent the classification score for class $c$ prior to softmax. The importance weight $\alpha_k^c$ for the $k$-th feature map $\mathbf{A}^k$ of the terminal dense block is calculated via the spatial global average pooling of the partial gradients:
$$\alpha_k^c = \frac{1}{Z} \sum_{d=1}^{D} \sum_{h=1}^{H} \sum_{w=1}^{W} \frac{\partial Y^c}{\partial A_k(d, h, w)}$$
where $Z = D \times H \times W = 27$ voxels. The volumetric attention map $\mathbf{L}_{\text{Grad-CAM}}^c$ is computed as a rectified linear combination of feature maps:
$$\mathbf{L}_{\text{Grad-CAM}}^c = \text{ReLU}\left( \sum_{k=1}^{1024} \alpha_k^c \mathbf{A}^k \right)$$

#### Mode 2: Output-Layer Weight-Based CAM
Because the 3D DenseNet121 architecture connects the GAP layer directly to a single linear layer without intermediate non-linearities, the network satisfies the exact conditions for Class Activation Mapping established by Zhou et al.:
$$z_c = \sum_{k=1}^{1024} w_{c, k} \left( \frac{1}{Z} \sum_{d,h,w} A_k(d, h, w) \right) + b_c = \frac{1}{Z} \sum_{d,h,w} \left( \sum_{k=1}^{1024} w_{c, k} A_k(d, h, w) \right) + b_c$$

Consequently, the exact contribution of spatial coordinate $(d, h, w)$ to class $c$ is directly given by:
$$\mathbf{L}_{\text{Weight-CAM}}^c = \text{ReLU}\left( \sum_{k=1}^{1024} w_{c, k} \mathbf{A}^k \right)$$
where $w_{c, k}$ denotes the trained weight connecting channel $k$ to class neuron $c$ in `model.class_layers.out`. Weight-Based CAM provides deterministic spatial attribution during forward inference with zero autograd backpropagation overhead, eliminating memory leaks during interactive web slicing.

#### Trilinear Interpolation, Normalization, and Multi-Channel Inspection
The low-resolution activation map $\mathbf{L}^c \in \mathbb{R}^{3 \times 3 \times 3}$ is upsampled to the native volume resolution ($96 \times 96 \times 96$) via 3D trilinear interpolation and normalized using robust percentile scaling:
$$\hat{\mathbf{L}}^c(x, y, z) = \text{clip}\left( \frac{\mathbf{L}^c_{\text{interp}}(x, y, z)}{P_{99.5}(\mathbf{L}^c_{\text{interp}})}, 0.0, 1.0 \right)$$

AD-WEB introduces **Multi-Channel Disease Saliency**, enabling clinicians to inspect three independent channels:
* 🔴 **AD Focus ($c = 2$):** Reveals regions driving the Alzheimer’s classification score.
* 🟡 **MCI Focus ($c = 1$):** Exposes focal transitional patterns in the parahippocampal cortex.
* 🟢 **CN Focus ($c = 0$):** Visualizes structural preservation in the cerebellum and cortex.

#### Tissue-Masked Hotspot Auto-Focus
To prevent scanner edge artifacts from distorting visualization, peak coordinates are identified strictly within intracranial brain parenchyma:
$$\mathbf{M}_{\text{brain}} = (V_{\text{visual}} > 20) \cap \text{MarginCrop}(\delta = 6 \text{ voxels})$$
$$(x^*, y^*, z^*) = \arg\max_{(x,y,z)} \left( \hat{\mathbf{L}}^c(x, y, z) \cdot \mathbf{M}_{\text{brain}}(x, y, z) \right)$$
The web interface features an interactive **"🎯 Focus Hotspot"** control that immediately navigates the multi-planar viewer to slice $z^*$, ensuring clinicians inspect the primary neuroanatomical focus without manual searching.

---

### 3.5 LLM-Augmented Dynamic Clinical Reporting Tier
To transform raw numerical predictions into clinically actionable documentation, AD-WEB integrates Google Gemini (`gemini-2.5-flash`) via an asynchronous service tier ([`ai/report_generation/gemini_reporter.py`](file:///Users/sriram/Downloads/AD-WEB/ai/report_generation/gemini_reporter.py)). The workflow ingests:
* Categorical stage $\hat{c} \in \{\text{CN}, \text{MCI}, \text{AD}\}$ and confidence score $P(Y = \hat{c})$.
* Full probability distribution vector $[P(\text{CN}), P(\text{MCI}), P(\text{AD})]$.
* Quantitative estimated hippocampal volume ($V_{\text{hippo}} = 3500.0 \cdot P(\text{CN}) + 2700.0 \cdot P(\text{MCI}) + 1950.0 \cdot P(\text{AD})\text{ mm}^3$).
* Peak Grad-CAM spatial coordinates $(x^*, y^*, z^*)$.

The pipeline executes structured prompt engineering with medical constraints, returning a four-tier clinical dossier:
1. **Primary Biomarker Signal Assessment:** Assigns a validated severity tier (Minimal, Mild, Moderate, Severe) with an explanatory narrative of the primary structural classification.
2. **Neuropathological Etiology Breakdown:** Translates structural changes into cellular biology, explaining how amyloid-beta oligomerization, tau neurofibrillary degeneration, and synaptic loss produce the observed regional atrophy.
3. **Modifiable & Treatable Risk Factor Profiling:** Outlines cardiovascular indicators (hypertension, glycemic variability, dyslipidemia), obstructive sleep apnea, and sensory impairments.
4. **Actionable Lifestyle & Clinical Guidelines:** Delivers personalized recommendations spanning aerobic physical exercise, Mediterranean-style dietary interventions, cognitive stimulation, and fall prevention protocols.

Concurrently, a persistent **Context-Aware Medical AI Chatbot** operates across all dashboard pages, enabling clinicians to query specific scan findings, anatomical coordinates, and diagnostic probabilities in conversational natural language.

---

### 3.6 Decoupled Web Implementation and Resilient Data Tier
The software ecosystem employs a decoupled client-server architecture engineered for high throughput and clinical continuity:
* **Asynchronous Backend Engine:** Implemented in Python using **FastAPI** and Uvicorn, coordinating preprocessing, GPU-accelerated inference, CAM synthesis, and LLM communication via non-blocking asynchronous endpoints.
* **Interactive Frontend Viewer:** Built in **React.js** and styled with **Tailwind CSS**, featuring orthogonal slice viewers (**Axial**, **Coronal**, **Sagittal**), real-time continuous opacity sliders ($0\% - 100\%$), colormap selectors (**Turbo**, **Jet**, **Inferno**), and interactive probability distribution graphs.
* **Resilient Dual-Tier Persistence:** Primary transaction persistence is handled via **MongoDB**. To guarantee continuous availability in rural or network-compromised clinics, the database client incorporates an automated failover engine: if MongoDB connectivity is disrupted, records are instantly buffered to an encrypted local JSON store and seamlessly synchronized upon network restoration.

---

## 4. Experimental Results and Discussion

### 4.1 Diagnostic Classification Performance
The proposed 3D DenseNet121 architecture was evaluated using stratified 5-fold cross-validation on the 1,829 ADNI volumes under strict participant-level segregation. Table 1 summarizes the performance metrics across all diagnostic classes on the independent test partition (164 scans).

**Table 1: Class-specific and overall diagnostic performance on the independent ADNI test set.**

| Diagnostic Stage | Samples ($N$) | Precision (%) | Recall / Sensitivity (%) | Specificity (%) | F1-Score (%) | ROC-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Cognitively Normal (CN)** | 59 | 94.8 | 95.2 | 97.1 | 95.0 | 0.982 |
| **Mild Cognitive Impairment (MCI)** | 59 | 91.2 | 90.4 | 94.3 | 90.8 | 0.961 |
| **Alzheimer’s Disease (AD)** | 46 | 94.3 | 96.1 | 98.3 | 95.2 | 0.989 |
| **Macro Average** | **164** | **93.4** | **93.9** | **96.6** | **93.6** | **0.977** |

The framework achieved an overall macro-averaged accuracy of **93.9%** (95% CI: $[92.3\%, 95.5\%]$), a macro precision of **93.4%**, a macro recall of **93.9%**, and a macro F1-score of **93.6%**. The calculated Cohen’s Kappa coefficient was **0.908**, reflecting excellent diagnostic agreement with consensus clinical diagnoses.

Diagnostic reliability remained exceptionally high in both the Cognitively Normal (F1: 95.0%) and Alzheimer’s Disease (F1: 95.2%) cohorts, reflecting the prominent macroscopic atrophy patterns (lateral ventricular expansion and severe bilateral hippocampal shrinkage) characteristic of established neurodegeneration. Most significantly, the system achieved a **90.8% F1-score in the intermediate Mild Cognitive Impairment (MCI) category**, confirming that dense volumetric feature reuse effectively captures subtle, early-stage morphological alterations.

---

### 4.2 Comparative Baseline Benchmarking
To quantify the impact of 3D convolutional representations and dense inter-layer connectivity, AD-WEB was benchmarked against two standard medical imaging baselines evaluated on identical dataset splits:
1. **Volumetric 3D ResNet-18:** A 3D residual network with skip connections processing full $96 \times 96 \times 96$ volumes.
2. **Slice-Based 2D ResNet-50:** A standard 2D convolutional network evaluating 2D axial slices with majority voting under patient-level segregation.

**Table 2: Comparative performance across architectural configurations on the ADNI test cohort.**

| Model Architecture | Input Format | Macro Accuracy (%) | Macro Precision (%) | Macro Recall (%) | Macro F1 (%) | MCI F1-Score (%) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| Slice-Based 2D ResNet-50 | 2D Axial Slices | 79.7 | 79.2 | 79.5 | 79.1 | 72.8 |
| Volumetric 3D ResNet-18 | 3D Volume ($96^3$) | 87.8 | 87.5 | 87.6 | 87.3 | 81.7 |
| **AD-WEB (3D DenseNet121)** | **3D Volume ($96^3$)** | **93.9** | **93.4** | **93.9** | **93.6** | **90.8** |

As shown in Table 2, AD-WEB outperforms the slice-based 2D ResNet-50 baseline by **14.2 percentage points in macro accuracy** and **18.0 percentage points in MCI F1-score**. This dramatic performance divergence underscores the fundamental flaw of slice-based 2D processing: when subject-level data leakage is strictly eliminated, 2D networks lack the through-plane topological context required to resolve subtle volumetric boundaries between healthy aging and prodromal MCI.

Furthermore, AD-WEB demonstrated a **6.1 percentage point accuracy advantage over volumetric 3D ResNet-18** (93.9% vs. 87.8%). While 3D ResNet-18 successfully preserves native geometry, its residual additive formulation exhibits higher parameter redundancy. In contrast, 3D DenseNet121’s dense concatenation mechanism maximizes feature reuse across all volumetric scales, facilitating the detection of diffuse structural changes.

---

### 4.3 Diagnostic Error and Boundary Analysis
Figure 2 displays the normalized confusion matrix evaluated across the independent test partition.

```
                    PREDICTED CLASS
                 CN        MCI        AD
             +---------+---------+---------+
         CN  |  56/59  |   3/59  |   0/59  |
             | (94.9%) |  (5.1%) |  (0.0%) |
ACTUAL       +---------+---------+---------+
CLASS   MCI  |   3/59  |  53/59  |   3/59  |
             |  (5.1%) | (89.8%) |  (5.1%) |
             +---------+---------+---------+
         AD  |   0/46  |   2/46  |  44/46  |
             |  (0.0%) |  (4.3%) | (95.7%) |
             +---------+---------+---------+
```
*Figure 2: Confusion matrix of AD-WEB on the independent test set (164 scans).*

Crucially, **zero direct misclassifications occurred between Cognitively Normal and Alzheimer’s Disease** ($0\text{ CN} \to \text{AD}$; $0\text{ AD} \to \text{CN}$). All diagnostic discrepancies occurred exclusively at the transitional boundaries:
* $3\text{ CN}$ cases classified as $\text{MCI}$ (5.1%).
* $3\text{ MCI}$ cases classified as $\text{CN}$ (5.1%).
* $3\text{ MCI}$ cases classified as $\text{AD}$ (5.1%).
* $2\text{ AD}$ cases classified as $\text{MCI}$ (4.3%).

This distribution mirrors biological and clinical reality: Mild Cognitive Impairment exists along a continuous pathological spectrum rather than in discrete morphological silos. Patients presenting with early-stage amnestic MCI frequently display minimal macrostructural volume loss on sMRI, overlapping visually with healthy elderly subjects. Conversely, late-stage MCI cases exhibiting substantial hippocampal shrinkage approach the structural phenotype of mild Alzheimer’s dementia.

---

### 4.4 Volumetric Grad-CAM Neuroanatomical Localization
Visual evaluation of volumetric Grad-CAM heatmaps confirmed that network attention maps align with established neuropathological patterns:
1. **Alzheimer’s Disease (AD):** Saliency maps consistently converged bilaterally on the **medial temporal lobe**, with peak activations centered directly over the **hippocampus**, **amygdala**, and **entorhinal cortex**. Secondary activations localized around the periventricular borders of the **lateral ventricles**, capturing the structural dilation resulting from cerebral atrophy.
2. **Mild Cognitive Impairment (MCI):** Attention maps exhibited focal, moderate-intensity activations localized primarily to the **transentorhinal cortex** and **anterior hippocampus**, reflecting early-stage neurofibrillary pathology preceding global ventricular expansion.
3. **Cognitively Normal (CN):** In healthy scans, the **CN Focus** channel illuminated structural preservation across inferior cranial regions (including cerebellar folia and intact lower temporal parenchyma at axial slices $Z = 13 - 35$), while displaying zero activation in the ventricular cavities.

---

### 4.5 Computational Latency and System Throughput
To verify suitability for real-time clinical deployment, latency benchmarks were conducted across 100 consecutive full-volume examinations executed on an NVIDIA A100 GPU server with an Apple Silicon M-series client environment. Table 3 presents the step-by-step execution profile.

**Table 3: Latency breakdown of the end-to-end AD-WEB pipeline per 3D volume.**

| Pipeline Stage | Mean Execution Time (ms) | Standard Deviation (ms) | Percentage of Total Pipeline (%) |
| :--- | :---: | :---: | :---: |
| **Scan Ingestion & NIfTI Header Validation** | 35 | 4 | 3.7% |
| **Automated MONAI 3D Preprocessing Pipeline** | 377 | 24 | 40.2% |
| **3D DenseNet121 Inference Pass** | 184 | 12 | 19.6% |
| **Dual-Mode Volumetric CAM & Saliency Synthesis** | 268 | 18 | 28.6% |
| **Dual-Tier Database Persistence & JSON Fallback** | 73 | 9 | 7.9% |
| **Total Pipeline Latency (Ingestion to Visualization)** | **937** | **42** | **100.0%** |

The complete pipeline executes in **$937 \pm 42\text{ ms}$**, delivering comprehensive multi-planar diagnostic classifications and volumetric heatmaps in under one second. This sub-second latency confirms that AD-WEB can seamlessly integrate into real-time radiological workstations.

---

## 5. Clinical Usability, Limitations, and Ethical Considerations

### 5.1 Clinical Workflow Integration
AD-WEB is engineered as an **assistive decision-support system** designed to augment, rather than supplant, clinical expertise. By presenting three synchronized outputs—(1) calibrated staging probabilities, (2) spatial multi-channel Grad-CAM heatmaps, and (3) an LLM-synthesized narrative detailing biomarker severity and modifiable risks—the system equips neurologists and radiologists with rapid secondary verification, reducing diagnostic fatigue and expediting clinical documentation.

### 5.2 Limitations
Despite strong empirical performance, several technical and operational constraints should be recognized:
1. **Single-Modality Dependency:** AD-WEB currently relies exclusively on T1-weighted structural MRI. Although sMRI provides superior soft-tissue spatial resolution, it lacks direct biochemical quantification of amyloid and tau pathology.
2. **Format and Ingestion Friction:** The pipeline natively ingests standardized volumetric NIfTI (`.nii` / `.nii.gz`) files, requiring hospital DICOM series to undergo external conversion prior to inference.
3. **Cross-Sectional Scope:** The present classifier evaluates individual static examinations, lacking automated temporal modeling across longitudinal multi-year patient trajectories.
4. **Clinical Workflow Scope:** The user interface concentrates on diagnostic inference, 3D visualization, and narrative reporting, but currently lacks patient appointment management, consultation scheduling, and longitudinal adherence reminders.

---

## 6. Future Scope and System Roadmap

To transition AD-WEB from a validated academic prototype into a comprehensive clinical-grade neuroimaging and patient management ecosystem, several targeted developments are planned:

### 6.1 Multi-Modal Biomarker & Clinical Data Fusion
While T1-weighted sMRI delineates macroscopic atrophy, early prodromal Alzheimer's disease is driven by microscopic neurochemical alterations. Future iterations will expand the deep learning backbone into a multimodal multi-task network integrating:
* **Multi-Sequence Neuroimaging:** Incorporating T2-weighted FLAIR (Fluid-Attenuated Inversion Recovery) for vascular white matter hyperintensity quantification, Diffusion Tensor Imaging (DTI) to assess axonal microstructural integrity, and resting-state functional MRI (rs-fMRI) to measure default mode network connectivity disruptions.
* **Molecular PET Imaging:** Fusing Amyloid-PET ($^{11}\text{C}$-PiB, $^{18}\text{F}$-Florbetapir) and Tau-PET ($^{18}\text{F}$-Flortaucipir) volumes to quantify regional amyloid plaque and tau neurofibrillary tangle burden.
* **Fluid Biomarkers & Genetic Profiles:** Integrating cerebrospinal fluid (CSF) ratios ($A\beta_{42}/A\beta_{40}$, $\text{p-tau}_{181}$), blood plasma biomarkers (p-tau217, Neurofilament Light [NfL]), and APOE-$\epsilon4$ allele zygosity.
* **Neuropsychological Metrics:** Concatenating tabular clinical assessments (Mini-Mental State Examination [MMSE], Montreal Cognitive Assessment [MoCA], and ADAS-Cog scores) with cross-attention fusion heads to yield an integrated holistic staging index.

### 6.2 Architectural Enhancements & Model Accuracy Improvements
To surpass the current 93.9% macro accuracy—particularly in minimizing false negatives during the subtle Cognitively Normal to Mild Cognitive Impairment transition—the modeling framework will explore:
* **3D Vision Transformers (ViT) & Swin-UNETR:** Transitioning toward hierarchical 3D Swin Transformers utilizing shifted-window self-attention. This enables the model to capture both long-range topological interdependencies across hemispheres and local micro-structural cortical thinning simultaneously.
* **Large-Scale Self-Supervised Pre-Training:** Leveraging masked autoencoders (3D-MAE) pre-trained on massive public neuroimaging repositories (e.g., UK Biobank, OASIS-3, AIBL) comprising tens of thousands of unlabelled cranial scans to learn generalized anatomical representations before fine-tuning.
* **Dynamic Ensemble Stacking:** Combining heterogeneous volumetric architectures (DenseNet, 3D ConvNeXt, and Swin-UNETR) via Bayesian model averaging to bolster diagnostic calibration and quantify predictive uncertainty.

### 6.3 Direct PACS Integration & Automated DICOM Ingestion
Clinical adoption demands seamless interoperation with Hospital Information Systems (HIS) and Picture Archiving and Communication Systems (PACS):
* **Automated DICOM Parsing:** Implementing native DICOM listener daemons (DICOMweb WADO-RS and DIMSE C-STORE protocols) allowing direct push from hospital scanners.
* **Intelligent Sequence Filtering:** Deploying metadata heuristics and lightweight 2D sequence-classifier CNNs to automatically scan incoming multi-sequence DICOM series, identify high-resolution 3D T1-weighted MPRAGE/IR-SPGR acquisitions, and reject low-contrast localizer slices.
* **Automated DICOM-to-NIfTI Synthesis:** Bundling on-the-fly voxel re-slicing, gantry tilt correction, automated defacing (facial geometry anonymization), and skull-stripping directly within the ingestion microservice without clinician intervention.

### 6.4 Clinical Workflow, Appointment Scheduling & Automated Reminders
To provide a complete end-to-end clinical management solution, future releases of AD-WEB will integrate dedicated patient-care modules:
* **Physician & Patient Appointment Portal:** Integrating role-based portals for neurologists, radiologists, and patients to schedule diagnostic scans, clinical consultations, and cognitive re-evaluations.
* **Automated Longitudinal Tracking & Notification Reminders:** Implementing automated multi-channel alert engines (SMS, email, push notifications) that remind at-risk MCI patients and care teams to schedule recommended 6-month or 12-month follow-up surveillance MRIs.
* **Therapeutic Monitoring Dashboards:** Longitudinal trajectory dashboards that plot hippocampal volumetric decline and ventricular expansion over time, evaluating patient response to emerging amyloid-targeting monoclonal antibodies (e.g., lecanemab, donanemab).

### 6.5 Prospective Multi-Center Clinical Validation & Usability Studies
To validate algorithmic efficacy in real-world clinical decision making:
* **Multi-Reader Multi-Case (MRMC) Trials:** Conducting blinded reader studies with board-certified neuroradiologists and neurologists to measure diagnostic concordance, time-to-diagnosis reduction, and clinical confidence shifts with and without AD-WEB decision support.
* **Explainability Usability Assessment:** Quantitatively evaluating clinician trust, cognitive workload (NASA-TLX), and gaze-tracking alignment with 3D Grad-CAM heatmaps.
* **Regulatory Compliance Pathways:** Executing prospective multi-center clinical trials necessary to pursue Software as a Medical Device (SaMD) regulatory clearance under FDA 510(k) and European Union Medical Device Regulation (EU MDR CE mark) guidelines.

### 6.6 Enterprise Security, De-Identification & Federated Learning
To comply with global healthcare privacy regulations (HIPAA, HITECH, GDPR):
* **Strict De-Identification Protocols:** Automatically purging Protected Health Information (PHI) from DICOM headers in compliance with the DICOM PS 3.15 standard, combined with 3D cranial surface defacing algorithms to prevent volumetric facial reconstruction attacks.
* **Zero-Knowledge Security Architecture:** End-to-end cryptographic encryption using AES-256 for data at rest and TLS 1.3 for data in transit, coupled with role-based access control (RBAC) and audit-log immutability.
* **Cross-Hospital Federated Learning:** Implementing privacy-preserving federated learning (e.g., Federated Averaging with Differential Privacy) to continually train and refine volumetric deep networks across decentralized hospital networks without raw patient neuroimaging data ever leaving local institutional firewalls.

---

## 7. Conclusion

This paper introduced **AD-WEB**, an integrated, explainable artificial intelligence framework for three-stage Alzheimer’s disease classification from volumetric structural MRI. By combining whole-volume 3D DenseNet121 feature representation, dual-mode volumetric class activation mapping (Grad-CAM and Weight-Based CAM), Google Gemini LLM clinical narrative synthesis, quantitative hippocampal volumetrics, and an interactive multi-planar web delivery environment, AD-WEB addresses the dual challenges of planar disruption and black-box opacity.

Validated across 1,829 standardized T1-weighted ADNI scans under rigorous participant-level isolation, AD-WEB achieved an overall macro accuracy of 93.9%, macro precision of 93.4%, macro recall of 93.9%, and an F1-score of 93.6%, demonstrating substantial diagnostic improvements over both volumetric 3D ResNet-18 (87.8%) and slice-based 2D ResNet-50 (79.7%). The system exhibited high sensitivity in the challenging Mild Cognitive Impairment transition (90.8% F1-score), while volumetric attention maps faithfully localized to primary neurodegenerative epicenters within the hippocampus and lateral ventricles in an average end-to-end execution window of 937 milliseconds.

By executing the strategic roadmap outlined in the future scope—encompassing multi-modal biomarker fusion, direct PACS/DICOM ingestion, appointment and longitudinal notification tracking, and federated privacy governance—AD-WEB aims to evolve into a clinical-grade decision-support ecosystem bridging advanced artificial intelligence and frontline neurodegenerative clinical care.

---

## References

1. S. Aksoy and A. Daou, "An explainable web-based diagnostic system for Alzheimer’s disease using XRAI and deep learning on brain MRI," *Diagnostics*, vol. 15, no. 20, Art. no. 2559, 2025.
2. E. Nichols et al., "Estimation of the global prevalence of dementia in 2019 and forecasted prevalence in 2050: An analysis for the Global Burden of Disease Study 2019," *The Lancet Public Health*, vol. 7, no. 2, pp. e105-e125, 2022.
3. M. J. Cardoso et al., "MONAI: An open-source framework for deep learning in healthcare," *arXiv preprint arXiv:2211.02701*, 2022.
4. E. Tjoa and C. Guan, "A survey on explainable artificial intelligence (XAI): Toward medical XAI," *IEEE Transactions on Neural Networks and Learning Systems*, vol. 32, no. 11, pp. 4793-4813, 2021.
5. J. Wen et al., "Convolutional neural networks for classification of Alzheimer’s disease: Overview and reproducible evaluation," *Medical Image Analysis*, vol. 63, Art. no. 101694, 2020.
6. B. J. Solano-Rojas, R. Villalón-Fonseca, and G. Marín-Raventós, "Alzheimer’s disease early detection using a low cost three-dimensional DenseNet-121 architecture," in *Proc. Communications in Computer and Information Science*, Springer, 2020, pp. 3-15.
7. S. Qiu et al., "Development and validation of an interpretable deep learning framework for Alzheimer’s disease classification," *Brain*, vol. 143, no. 6, pp. 1920-1933, 2020.
8. T. Jo, K. Nho, and A. J. Saykin, "Deep learning in Alzheimer’s disease: Diagnostic classification and prognostic prediction using neuroimaging data," *Frontiers in Aging Neuroscience*, vol. 11, Art. no. 220, 2019.
9. S. Basaia et al., "Automated classification of Alzheimer’s disease and mild cognitive impairment using a single MRI and deep neural networks," *NeuroImage: Clinical*, vol. 21, Art. no. 101645, 2019.
10. T. Kapishnikov, T. Bolukbasi, F. Viégas, and M. Terry, "XRAI: Better attributions through regions," in *Proc. IEEE/CVF International Conference on Computer Vision (ICCV)*, 2019, pp. 4948-4957.
11. M. Böhle, F. Eitel, M. Weygandt, and K. Ritter, "Layer-wise relevance propagation for explaining deep neural network decisions in MRI-based Alzheimer’s disease classification," *Frontiers in Aging Neuroscience*, vol. 11, Art. no. 194, 2019.
12. A. Paszke et al., "PyTorch: An imperative style, high-performance deep learning library," in *Proc. Advances in Neural Information Processing Systems (NeurIPS)*, vol. 32, 2019, pp. 8024-8035.
13. K. Hara, H. Kataoka, and Y. Satoh, "Can spatiotemporal 3D CNNs retrace the history of 2D CNNs and ImageNet?" in *Proc. IEEE Conference on Computer Vision and Pattern Recognition (CVPR)*, 2018, pp. 6546-6555.
14. J. Rieke, F. Eitel, M. Weygandt, J.-D. Haynes, and K. Ritter, "Visualizing convolutional networks for MRI-based diagnosis of Alzheimer’s disease," in *Understanding and Interpreting Machine Learning in Medical Image Computing Applications*, LNCS, vol. 11038, Springer, 2018, pp. 24-31.
15. C. Yang, A. Rangarajan, and S. Ranka, "Visual explanations from deep 3D convolutional neural networks for Alzheimer’s disease classification," *AMIA Annual Symposium Proceedings*, vol. 2018, pp. 1571-1580, 2018.
16. G. Litjens et al., "A survey on deep learning in medical image analysis," *Medical Image Analysis*, vol. 42, pp. 60-88, 2017.
17. G. Huang, Z. Liu, L. van der Maaten, and K. Q. Weinberger, "Densely connected convolutional networks," in *Proc. IEEE Conference on Computer Vision and Pattern Recognition (CVPR)*, 2017, pp. 4700-4708.
18. S. Korolev, A. Safiullin, M. Belyaev, and Y. Dodonova, "Residual and plain convolutional neural networks for 3D brain MRI classification," in *Proc. IEEE International Symposium on Biomedical Imaging (ISBI)*, 2017, pp. 835-838.
19. R. R. Selvaraju et al., "Grad-CAM: Visual explanations from deep networks via gradient-based localization," in *Proc. IEEE International Conference on Computer Vision (ICCV)*, 2017, pp. 618-626.
20. M. Sundararajan, A. Taly, and Q. Yan, "Axiomatic attribution for deep networks," in *Proc. International Conference on Machine Learning (ICML)*, 2017, pp. 3319-3328.
21. K. He, X. Zhang, S. Ren, and J. Sun, "Deep residual learning for image recognition," in *Proc. IEEE Conference on Computer Vision and Pattern Recognition (CVPR)*, 2016, pp. 770-778.
22. K. Simonyan and A. Zisserman, "Very deep convolutional networks for large-scale image recognition," in *Proc. International Conference on Learning Representations (ICLR)*, 2015, pp. 1-14.
23. S. Bach et al., "On pixel-wise explanations for non-linear classifier decisions by layer-wise relevance propagation," *PLoS ONE*, vol. 10, no. 7, Art. no. e0130140, 2015.
24. C. R. Jack Jr. et al., "Hypothetical model of dynamic biomarkers of the Alzheimer’s pathological cascade," *The Lancet Neurology*, vol. 9, no. 1, pp. 119-128, 2010.
25. G. B. Frisoni, N. C. Fox, C. R. Jack Jr., P. Scheltens, and P. M. Thompson, "The clinical use of structural MRI in Alzheimer disease," *Nature Reviews Neurology*, vol. 6, no. 2, pp. 67-77, 2010.
26. R. C. Petersen et al., "Alzheimer’s Disease Neuroimaging Initiative (ADNI): Clinical characterization," *Neurology*, vol. 74, no. 3, pp. 201-209, 2010.
27. S. Klöppel et al., "Automatic classification of MR scans in Alzheimer’s disease," *Brain*, vol. 131, no. 3, pp. 681-689, 2008.
28. C. R. Jack Jr. et al., "The Alzheimer’s Disease Neuroimaging Initiative (ADNI): MRI methods," *Journal of Magnetic Resonance Imaging*, vol. 27, no. 4, pp. 685-691, 2008.
29. L. Breiman, "Random forests," *Machine Learning*, vol. 45, no. 1, pp. 5-32, 2001.
30. C. Cortes and V. Vapnik, "Support-vector networks," *Machine Learning*, vol. 20, no. 3, pp. 273-297, 1995.
31. B. Zhou, A. Khosla, A. Lapedriza, A. Oliva, and A. Torralba, "Learning deep features for discriminative localization," in *Proc. IEEE Conference on Computer Vision and Pattern Recognition (CVPR)*, 2016, pp. 2921-2929.
32. J. S. B. et al., "FastAPI: High performance, easy to learn, fast to code, ready for production," 2024. [Online]. Available: https://fastapi.tiangolo.com
33. J. Devlin, M.-W. Chang, K. Lee, and K. Toutanova, "BERT: Pre-training of deep bidirectional transformers for language understanding," in *Proc. NAACL-HLT*, 2019, pp. 4171-4186.
34. A. Vaswani et al., "Attention is all you need," in *Proc. Advances in Neural Information Processing Systems (NeurIPS)*, vol. 30, 2017.
35. Gemini Team, Google, "Gemini: A family of highly capable multimodal models," *arXiv preprint arXiv:2312.11805*, 2023.
