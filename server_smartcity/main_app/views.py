from django.shortcuts import render, redirect, get_object_or_404
from django.views import View
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy
from django.db import models
from django.contrib import messages
from django.http import JsonResponse
from .models import Report
from .forms import ReportForm


class AdminRequiredMixin:
    """Mixin untuk memproteksi view agar hanya bisa diakses oleh Admin."""

    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            messages.error(request, 'Anda harus login terlebih dahulu.')
            return redirect('login')
        if not request.user.is_admin:
            messages.error(request, 'Akses Ditolak.')
            return redirect('login')
        return super().dispatch(request, *args, **kwargs)


def home(request):
    return render(request, 'main_app/home.html')


def report_detail_api(request, pk):
    """
    API view untuk mengambil detail laporan sebagai JSON.
    Digunakan oleh test coverage untuk memverifikasi akses detail laporan.
    """
    report = get_object_or_404(Report, pk=pk)
    data = {
        'id': report.id,
        'title': report.title,
        'category': report.category,
        'description': report.description,
        'location': report.location,
        'status': report.status,
    }
    return JsonResponse(data)


def report_search(request):
    """
    View pencarian laporan — hanya untuk Admin.
    Mengembalikan JSON hasil pencarian berdasarkan query param ?q=
    """
    if not request.user.is_authenticated:
        return redirect('login')
    if not request.user.is_admin:
        return redirect('login')

    query = request.GET.get('q', '')
    results = Report.objects.filter(
        models.Q(title__icontains=query) |
        models.Q(description__icontains=query) |
        models.Q(location__icontains=query)
    ).values('id', 'title', 'category', 'status', 'location')

    return JsonResponse({'results': list(results)})


class ReportListView(AdminRequiredMixin, ListView):
    model = Report
    template_name = 'main_app/report_list.html'
    context_object_name = 'reports'
    paginate_by = 10

    def get_queryset(self):
        queryset = Report.objects.all().order_by('-created_at')
        search_query = self.request.GET.get('search')
        if search_query:
            queryset = queryset.filter(
                models.Q(title__icontains=search_query) |
                models.Q(description__icontains=search_query) |
                models.Q(location__icontains=search_query)
            )
        category = self.request.GET.get('category')
        if category:
            queryset = queryset.filter(category=category)
        status = self.request.GET.get('status')
        if status:
            queryset = queryset.filter(status=status)
        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['search_query'] = self.request.GET.get('search', '')
        context['selected_category'] = self.request.GET.get('category', '')
        context['selected_status'] = self.request.GET.get('status', '')
        return context


class ReportDetailView(AdminRequiredMixin, DetailView):
    model = Report
    template_name = 'main_app/report_detail.html'
    context_object_name = 'report'


class ReportCreateView(AdminRequiredMixin, CreateView):
    model = Report
    form_class = ReportForm
    template_name = 'main_app/add_report.html'
    success_url = reverse_lazy('report_list')


class ReportUpdateView(AdminRequiredMixin, UpdateView):
    model = Report
    form_class = ReportForm
    template_name = 'main_app/edit_report.html'
    success_url = reverse_lazy('report_list')


class ReportDeleteView(AdminRequiredMixin, DeleteView):
    model = Report
    template_name = 'main_app/delete_report.html'
    success_url = reverse_lazy('report_list')
    context_object_name = 'report'


class ReportUpdateStatusView(AdminRequiredMixin, View):
    def post(self, request, pk):
        report = get_object_or_404(Report, pk=pk)
        new_status = request.POST.get('status')
        if report.is_transition_allowed(new_status):
            report.status = new_status
            report.save()
        return redirect('report_list')