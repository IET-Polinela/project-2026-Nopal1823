from rest_framework import serializers
from .models import Report

class ReportSerializer(serializers.ModelSerializer):
    reporter = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            'id', 'title', 'category', 'description', 'location',
            'status', 'reporter', 'is_owner', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'reporter', 'is_owner', 'created_at', 'updated_at']

    def get_reporter(self, obj):
        return "Warga Anonim"

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        # Guard: reporter bisa None untuk laporan lama
        if obj.reporter is None:
            return False
        return obj.reporter.pk == request.user.pk