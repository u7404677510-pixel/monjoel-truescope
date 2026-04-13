import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface LoginForm {
  email: string;
  password: string;
}

export function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError("");
    try {
      await login(data.email, data.password);
      navigate("/admin");
    } catch {
      setError("Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src={`${import.meta.env.BASE_URL}logo-joel.svg`} alt="Joël" className="login-logo-img" />
          <h1>TrueScope</h1>
          <p>Administration · Diagnostic IA</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div className="field-group">
            <label htmlFor="email" className="field-label">Email</label>
            <input
              id="email"
              type="email"
              className="field-input"
              autoComplete="email"
              {...register("email", { required: "Email requis" })}
            />
            {errors.email && <span className="field-error">{errors.email.message}</span>}
          </div>

          <div className="field-group">
            <label htmlFor="password" className="field-label">Mot de passe</label>
            <input
              id="password"
              type="password"
              className="field-input"
              autoComplete="current-password"
              {...register("password", { required: "Mot de passe requis" })}
            />
            {errors.password && <span className="field-error">{errors.password.message}</span>}
          </div>

          {error && <p className="field-error login-error">{error}</p>}

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
