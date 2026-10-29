from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth import views as auth_views
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render
from django.urls import reverse_lazy
from django.utils.http import url_has_allowed_host_and_scheme
from django.utils.translation import gettext as _

from apps.security import devices, flow, throttle

from .forms import (
    LoginForm,
    PasswordChangeForm,
    PasswordResetForm,
    ProfileForm,
    SetPasswordForm,
    SignupForm,
)


def _next_url(request, default="core:home"):
    target = request.POST.get("next") or request.GET.get("next")
    if target and url_has_allowed_host_and_scheme(target, {request.get_host()}):
        return target
    return default


def signup(request):
    if request.user.is_authenticated:
        return redirect("core:home")
    form = SignupForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        user = form.save()
        login(request, user, backend=flow.PASSWORD_BACKEND)
        messages.success(
            request, _("Bienvenue %(name)s, votre compte est créé.") % {"name": user.first_name}
        )
        response = redirect(_next_url(request))
        devices.on_login(request, user, response)
        return response
    return render(request, "accounts/signup.html", {"form": form, "next": _next_url(request, "")})


class LoginView(auth_views.LoginView):
    form_class = LoginForm
    template_name = "accounts/login.html"
    redirect_authenticated_user = True

    def form_valid(self, form):
        user = form.get_user()
        throttle.reset("login", self.request, form.cleaned_data["username"])
        if flow.needs_second_factor(self.request, user):
            return flow.start(self.request, user, self.get_success_url())
        return flow.complete(self.request, user, self.get_success_url(), backend=user.backend)


class LogoutView(auth_views.LogoutView):
    pass


@login_required
def profile(request):
    form = ProfileForm(request.POST or None, instance=request.user)
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, _("Profil mis à jour."))
        return redirect("accounts:profile")
    return render(request, "accounts/profile.html", {"form": form})


class PasswordChangeView(auth_views.PasswordChangeView):
    form_class = PasswordChangeForm
    template_name = "accounts/password_change.html"
    success_url = reverse_lazy("accounts:profile")

    def form_valid(self, form):
        messages.success(self.request, _("Mot de passe modifié."))
        return super().form_valid(form)


class PasswordResetView(auth_views.PasswordResetView):
    form_class = PasswordResetForm
    template_name = "accounts/password_reset.html"
    email_template_name = "accounts/emails/password_reset.txt"
    subject_template_name = "accounts/emails/password_reset_subject.txt"
    success_url = reverse_lazy("accounts:password_reset_done")


class PasswordResetDoneView(auth_views.PasswordResetDoneView):
    template_name = "accounts/password_reset_done.html"


class PasswordResetConfirmView(auth_views.PasswordResetConfirmView):
    form_class = SetPasswordForm
    template_name = "accounts/password_reset_confirm.html"
    success_url = reverse_lazy("accounts:login")

    def form_valid(self, form):
        messages.success(self.request, _("Mot de passe réinitialisé. Vous pouvez vous connecter."))
        return super().form_valid(form)
