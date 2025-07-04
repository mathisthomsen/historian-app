# Page snapshot

```yaml
- alert
- button "Open Next.js Dev Tools":
  - img
- main:
  - heading "Join Historian App" [level=1]
  - heading "Start building your family tree and preserving your family's history" [level=5]
  - paragraph: ✨ Create and manage family trees
  - paragraph: 📅 Track important life events
  - paragraph: 👥 Map family relationships
  - paragraph: 📊 Visualize your family history
  - heading "Create Account" [level=1]
  - paragraph: Join Historian App to start building your family tree
  - text: Full Name
  - textbox "Full Name": Validation User
  - text: Email Address
  - textbox "Email Address": e2e_validation_1751554712239@example.com
  - text: Password
  - textbox: TestPass123!
  - button
  - text: "Password strength: Strong Confirm Password"
  - textbox
  - button
  - button "Create Account" [disabled]
  - separator:
    - paragraph: OR
  - paragraph:
    - text: Already have an account?
    - button "Sign In"
  - button "Add New"
```