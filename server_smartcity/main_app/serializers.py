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
        if obj.reporter is None:
            return False
        return obj.reporter.pk == request.user.pk

    def validate_status(self, new_status):
        """
        Validasi transisi status menggunakan logika is_transition_allowed()
        yang sudah didefinisikan di model Report.
        """
        # Saat update (instance sudah ada), validasi transisi
        if self.instance:
            if not self.instance.is_transition_allowed(new_status):
                raise serializers.ValidationError(
                    f"Transisi dari '{self.instance.status}' ke '{new_status}' tidak diizinkan."
                )
        return new_status