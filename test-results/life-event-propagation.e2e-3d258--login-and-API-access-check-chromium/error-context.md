# Page snapshot

```yaml
- alert
- button "Open Next.js Dev Tools":
  - img
- banner:
  - button "Menü öffnen"
  - text: Historian App
  - button
  - button "Login"
- progressbar
- main:
  - heading "Welcome Back" [level=1]
  - heading "Sign in to continue building your family's history" [level=5]
  - paragraph: 🔐 Secure authentication
  - paragraph: 📱 Access from any device
  - paragraph: 🔄 Sync across platforms
  - paragraph: 🛡️ Your data is protected
  - heading "Welcome Back" [level=1]
  - paragraph: Sign in to your Historian App account
  - text: Email Address
  - textbox "Email Address": propagation_e2e_1751554691150_ymyl6h0u3@example.com
  - text: Password
  - textbox: TestPass123!
  - button
  - checkbox "Remember me"
  - text: Remember me
  - button "Forgot password?"
  - button [disabled]:
    - progressbar:
      - img
  - separator:
    - paragraph: OR
  - paragraph:
    - text: Don't have an account?
    - button "Sign Up"
  - button "Add New"
```