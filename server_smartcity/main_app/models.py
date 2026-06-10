from django.db import models

STATUS_CHOICES = [
    ('DRAFT', 'Draft'),
    ('REPORTED', 'Reported'),
    ('VERIFIED', 'Verified'),
    ('IN_PROGRESS', 'In Progress'),
    ('RESOLVED', 'Resolved'),
]

STATUS_FLOW = ['DRAFT', 'REPORTED', 'VERIFIED', 'IN_PROGRESS', 'RESOLVED']

# Create your models here.
class Report(models.Model):
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    description = models.TextField()
    location = models.CharField(max_length=200)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='DRAFT'
    )
    reporter = models.ForeignKey(
        'usermanagement_24782088.CustomUser', 
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_allowed_statuses(self):
        try:
            current_index = STATUS_FLOW.index(self.status)
        except ValueError:
            return [self.status]

        if current_index + 1 < len(STATUS_FLOW):
            return [STATUS_FLOW[current_index], STATUS_FLOW[current_index + 1]]
        return [STATUS_FLOW[current_index]]

    def is_transition_allowed(self, new_status):
        return new_status in self.get_allowed_statuses()

    def __str__(self):
        return self.title