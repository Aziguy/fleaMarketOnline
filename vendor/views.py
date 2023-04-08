from django.contrib import messages
from django.contrib.auth.decorators import login_required, user_passes_test
from django.shortcuts import render, get_object_or_404, redirect
from django.template.defaultfilters import slugify

from accounts.forms import UserProfileForm
from accounts.models import UserProfile
from accounts.views import check_role_vendor
from vendor.forms import VendorForm
from vendor.models import Vendor
from menu.models import Category, Items
from menu.forms import CategoryForm, ItemForm


# Create your views here.
def get_vendor(request):
    vendor = Vendor.objects.get(user=request.user)
    return vendor


@login_required(login_url="login")
@user_passes_test(check_role_vendor)
def v_profile(request):
    profile = get_object_or_404(UserProfile, user=request.user)
    vendor = get_object_or_404(Vendor, user=request.user)

    if request.method == "POST":
        profile_form = UserProfileForm(request.POST, request.FILES, instance=profile)
        vendor_form = VendorForm(request.POST, request.FILES, instance=vendor)
        if profile_form.is_valid() and vendor_form.is_valid():
            profile_form.save()
            vendor_form.save()
            messages.success(request, "Settings updated.")
            return redirect("v-profile")
        else:
            print(profile_form.errors)
            print(vendor_form.errors)
    else:
        profile_form = UserProfileForm(instance=profile)
        vendor_form = VendorForm(instance=vendor)

    context = {
        "profile_form": profile_form,
        "vendor_form": vendor_form,
        "profile": profile,
        "vendor": vendor,
    }
    return render(request, "vendor/v-profile.html", context)


@login_required(login_url="login")
@user_passes_test(check_role_vendor)
def shelve_builder(request):
    vendor = get_vendor(request)
    categories = Category.objects.filter(vendor=vendor).order_by("created_at")
    context = {
        "categories": categories,
    }
    return render(request, "vendor/shelve-builder.html", context)


@login_required(login_url="login")
@user_passes_test(check_role_vendor)
def items_by_category(request, pk=None):
    vendor = get_vendor(request)
    category = get_object_or_404(Category, pk=pk)
    items = Items.objects.filter(vendor=vendor, category=category)
    context = {
        "items": items,
        "category": category,
    }
    return render(request, "vendor/items-by-category.html", context)


@login_required(login_url="login")
@user_passes_test(check_role_vendor)
def add_category(request):
    if request.method == "POST":
        form = CategoryForm(request.POST)
        if form.is_valid():
            category_name = form.cleaned_data["category_name"]
            category = form.save(commit=False)
            category.vendor = get_vendor(request)

            category.save()  # here the category id will be generated
            category.slug = (
                slugify(category_name) + "-" + str(category.id)
            )  # chicken-15
            category.save()
            messages.success(request, "Category added successfully!")
            return redirect("shelve-builder")
        else:
            print(form.errors)

    else:
        form = CategoryForm()
    context = {
        "form": form,
    }
    return render(request, "vendor/add-category.html", context)


@login_required(login_url="login")
@user_passes_test(check_role_vendor)
def edit_category(request, pk=None):
    category = get_object_or_404(Category, pk=pk)
    if request.method == "POST":
        form = CategoryForm(request.POST, instance=category)
        if form.is_valid():
            category_name = form.cleaned_data["category_name"]
            category = form.save(commit=False)
            category.vendor = get_vendor(request)
            category.slug = slugify(category_name)
            form.save()
            messages.success(request, "Category updated successfully!")
            return redirect("shelve-builder")
        else:
            print(form.errors)

    else:
        form = CategoryForm(instance=category)
    context = {
        "form": form,
        "category": category,
    }
    return render(request, "vendor/edit-category.html", context)


@login_required(login_url="login")
@user_passes_test(check_role_vendor)
def delete_category(request, pk=None):
    category = get_object_or_404(Category, pk=pk)
    category.delete()
    messages.success(request, "Category has been deleted successfully!")
    return redirect("shelve-builder")


@login_required(login_url="login")
@user_passes_test(check_role_vendor)
def add_item(request):
    if request.method == "POST":
        form = ItemForm(request.POST, request.FILES)
        if form.is_valid():
            item_title = form.cleaned_data["item_title"]
            item = form.save(commit=False)
            item.vendor = get_vendor(request)
            item.slug = slugify(item_title)
            form.save()
            messages.success(request, "Item added successfully!")
            return redirect("items-by-category", item.category.id)
        else:
            print(form.errors)
    else:
        form = ItemForm()
        # modify this form
        form.fields["category"].queryset = Category.objects.filter(
            vendor=get_vendor(request)
        )
    context = {
        "form": form,
    }
    return render(request, "vendor/add-item.html", context)


@login_required(login_url="login")
@user_passes_test(check_role_vendor)
def edit_item(request, pk=None):
    item = get_object_or_404(Items, pk=pk)
    if request.method == "POST":
        form = ItemForm(request.POST, request.FILES, instance=item)
        if form.is_valid():
            item_title = form.cleaned_data["item_title"]
            item = form.save(commit=False)
            item.vendor = get_vendor(request)
            item.slug = slugify(item_title)
            form.save()
            messages.success(request, "Item updated successfully!")
            return redirect("items-by-category", item.category.id)
        else:
            print(form.errors)

    else:
        form = ItemForm(instance=item)
        form.fields["category"].queryset = Category.objects.filter(
            vendor=get_vendor(request)
        )
    context = {
        "form": form,
        "item": item,
    }
    return render(request, "vendor/edit-item.html", context)


@login_required(login_url="login")
@user_passes_test(check_role_vendor)
def delete_item(request, pk=None):
    item = get_object_or_404(Items, pk=pk)
    item.delete()
    messages.success(request, "Item has been deleted successfully!")
    return redirect("items-by-category", item.category.id)
