from django.views.generic import TemplateView
from django.http import JsonResponse
from django.db.models import Count, Q
from main_app.models import Report


class DashboardView(TemplateView):
    """Main dashboard page — accessible by all users (Admin, Citizen, anonymous)."""
    template_name = 'dashboard_24782088/dashboard.html'


class DashboardStatsView(TemplateView):
    """
    Returns aggregated statistics as JSON for Chart.js rendering.
    Endpoint: /dashboard/api/stats/
    """

    def get(self, request, *args, **kwargs):
        # --- Status distribution (for Doughnut chart) ---
        status_qs = (
            Report.objects
            .values('status')
            .annotate(count=Count('id'))
            .order_by('status')
        )
        status_labels = [item['status'] for item in status_qs]
        status_counts = [item['count'] for item in status_qs]

        # --- Category distribution (for Bar chart) ---
        category_qs = (
            Report.objects
            .values('category')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        category_labels = [item['category'] for item in category_qs]
        category_counts = [item['count'] for item in category_qs]

        # --- 5 latest REPORTED ---
        latest_reported = list(
            Report.objects
            .filter(status='REPORTED')
            .order_by('-created_at')[:5]
            .values('id', 'title', 'category', 'location', 'created_at')
        )
        for r in latest_reported:
            r['created_at'] = r['created_at'].strftime('%d %b %Y, %H:%M')

        # --- 5 latest RESOLVED ---
        latest_resolved = list(
            Report.objects
            .filter(status='RESOLVED')
            .order_by('-created_at')[:5]
            .values('id', 'title', 'category', 'location', 'created_at')
        )
        for r in latest_resolved:
            r['created_at'] = r['created_at'].strftime('%d %b %Y, %H:%M')

        # --- Summary totals ---
        total = Report.objects.count()

        data = {
            'total': total,
            'status': {
                'labels': status_labels,
                'counts': status_counts,
            },
            'category': {
                'labels': category_labels,
                'counts': category_counts,
            },
            'latest_reported': latest_reported,
            'latest_resolved': latest_resolved,
        }
        return JsonResponse(data)


class DashboardSearchView(TemplateView):
    """
    Live search endpoint — returns matching reports as JSON.
    Endpoint: /dashboard/api/search/?q=<keyword>
    Supports debouncing from the frontend side.
    """

    def get(self, request, *args, **kwargs):
        query = request.GET.get('q', '').strip()

        reports_qs = Report.objects.all().order_by('-created_at')

        if query:
            reports_qs = reports_qs.filter(
                Q(title__icontains=query) |
                Q(description__icontains=query) |
                Q(location__icontains=query) |
                Q(category__icontains=query)
            )

        # Limit to 50 results to avoid huge payloads
        reports_qs = reports_qs[:50]

        results = []
        for r in reports_qs:
            results.append({
                'id': r.id,
                'title': r.title,
                'category': r.category,
                'location': r.location,
                'status': r.status,
                'created_at': r.created_at.strftime('%d %b %Y'),
            })

        return JsonResponse({'results': results, 'count': len(results), 'query': query})


class ReportDetailJsonView(TemplateView):
    """
    Returns single report detail as JSON for the AJAX modal.
    Endpoint: /dashboard/api/report/<pk>/
    """

    def get(self, request, pk, *args, **kwargs):
        try:
            r = Report.objects.get(pk=pk)
            data = {
                'id': r.id,
                'title': r.title,
                'category': r.category,
                'description': r.description,
                'location': r.location,
                'status': r.status,
                'created_at': r.created_at.strftime('%d %B %Y, %H:%M'),
            }
            return JsonResponse(data)
        except Report.DoesNotExist:
            return JsonResponse({'error': 'Report not found'}, status=404)
