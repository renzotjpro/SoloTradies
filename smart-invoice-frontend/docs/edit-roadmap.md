# Edit Profile Feature - Implementation Roadmap

This document outlines the strategy and step-by-step plan for implementing the Edit Profile feature. The goal is to provide a clean, modern, and user-friendly experience for updating organization and user details.

## 1. Architectural Strategy

We recommend using an **Inline Edit Form** approach. This means replacing the read-only profile information with a form *within the same tab* when the user clicks "Edit", rather than navigating to a completely new URL (e.g., `/settings/edit`).
- **Why?** It preserves context, feels faster (SPA experience), and avoids unnecessary page transitions.

### Key Tools & Libraries
- **Forms & State:** `react-hook-form` for managing form state without excessive re-renders.
- **Validation:** `zod` for strongly typed, schema-based validation (e.g., Australian ABN formats, emails, phone numbers).
- **UI Components:** Shadcn UI (or your existing UI library) for inputs, form groups, and buttons.
- **Icons:** `lucide-react` for UI icons.

---

## 2. Step-by-Step Implementation Plan

### Phase 1: View Mode Cleanup
The current "View Mode" is cluttered with the Avatar Upload section. We need to simplify the read-only view.

1. **Remove the Large Avatar Upload Section:**
   - In `src/app/settings/page.tsx`, take out the section containing the "JD" placeholder, the `Change Avatar` button, and the file input.
2. **Relocate the Avatar:**
   - Move the user's avatar to the top header card near the Organization Name (or a smaller, read-only version at the top of the Profile Information tab).
3. **Keep the Edit Button:**
   - The "Edit" button in the `<ProfileInformationTab />` header stays as the trigger to enter "Edit Mode."

### Phase 2: Building the Edit Component
Create a new component to handle the editing state.

1. **Create the Component:**
   - Create a new file: `src/app/settings/components/edit-profile-form.tsx` (or keep it in the same file if preferred).
2. **Define the Schema:**
   - Use `zod` to create a validation schema matching the fields (Organization Name, ABN, Industry, Tax Registration Number, Phone, Email, Country, State, City, Address Lines, Postcode).
3. **Initialize React Hook Form:**
   - Setup `useForm` with the `zodResolver` and populate `defaultValues` from the existing user data (or props passed from the parent).
4. **Build the Form Layout:**
   - Use a grid layout (e.g., `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) to neatly arrange the input fields, mirroring the read-only layout.
   - Include standard text inputs and potentially select dropdowns for Country/State.
5. **Add Avatar Upload to the Form:**
   - Integrate the Avatar upload functionality *inside* this form so the user updates their picture simultaneously with their text details.

### Phase 3: Wiring State and Interactions (View <-> Edit)
Connect the viewing and editing states in the main settings page.

1. **Add Toggle State:**
   - In your `ProfileInformationTab` component, introduce a boolean state: `const [isEditing, setIsEditing] = useState(false);`
2. **Conditional Rendering:**
   ```tsx
   if (isEditing) {
     return <EditProfileForm onCancel={() => setIsEditing(false)} onSave={handleSave} data={currentData} />;
   }
   return <ProfileView data={currentData} onEdit={() => setIsEditing(true)} />;
   ```
3. **Form Actions:**
   - **Cancel Button:** Reverts the view back to read-only (`setIsEditing(false)`) without saving.
   - **Save Button:** Submits the form data (to your API/Supabase backing), updates the local `currentData` state, and then switches back to the read-only view. Adding a loading spinner to the button during submission is highly recommended.

### Phase 4: Backend / Data Synchronization
Ensure data is persisted correctly.

1. **API Integration:**
   - Hook the `onSave` function to your backend update mutation (e.g., calling your `update_organization` or `update_profile` API endpoint).
2. **Optimistic Updates (Optional but Recommended):**
   - Update the UI with the new data immediately while the request is processing in the background to make the app feel instantly responsive.
3. **Error Handling:**
   - If the API request fails, display a toast or alert and keep the user in the edit form so they can correct any issues.

---

## 3. UI/UX Suggestions for the Builder

- **Input Styling:** Ensure form inputs have clear focus states (e.g., a branded ring/border color when active).
- **Validation Feedback:** Display red error messages directly below the specific input field that failed validation (e.g., "Invalid ABN format").
- **Avatar Preview:** When a user selects a new avatar image in the form, show a live preview of the image using `URL.createObjectURL` before they hit Save.
- **Sticky Footer (Optional):** If the form becomes very long, having the Save and Cancel buttons in a sticky footer at the bottom of the screen ensures they are always accessible without scrolling.
