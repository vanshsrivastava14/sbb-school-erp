import json

with open('data/sbb_erp_database.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Use existing password hash from swati
teacher_hash = None
for u in data['users']:
    if u['role'] == 'teacher':
        teacher_hash = u['passwordHash']
        break

class_teacher_mapping = [
    ('class-pn', 'anjali@sbbschool.com', 'Anjali Verma', '9838000001'),
    ('class-lkg', 'swati@sbbschool.com', 'Swati (Class Teacher)', '9792066753'),
    ('class-ukg', 'pooja@sbbschool.com', 'Pooja Tiwari', '9838000002'),
    ('class-1', 'ramesh@sbbschool.com', 'Ramesh Kumar', '9198000000'),
    ('class-2', 'sunita@sbbschool.com', 'Sunita Sharma', '9838000003'),
    ('class-3', 'manoj@sbbschool.com', 'Manoj Singh', '9838000004'),
    ('class-4', 'priya@sbbschool.com', 'Priya Mishra', '9838000005'),
    ('class-5', 'rajesh@sbbschool.com', 'Rajesh Yadav', '9838000006'),
    ('class-6', 'anita@sbbschool.com', 'Anita Gupta', '9838000007'),
    ('class-7', 'dharmendra@sbbschool.com', 'Dharmendra Kumar', '9838000008'),
    ('class-8', 'rekha@sbbschool.com', 'Rekha Patel', '9838000009'),
    ('class-9', 'suresh@sbbschool.com', 'Suresh Pandey', '9838000010'),
]

for class_id, email, name, phone in class_teacher_mapping:
    user = next((u for u in data['users'] if u['email'] == email), None)
    if not user:
        username = email.split('@')[0]
        user = {
            'id': f'user-teacher-{username}',
            'email': email,
            'passwordHash': teacher_hash,
            'fullName': name,
            'role': 'teacher',
            'phone': phone,
            'isActive': True,
            'createdAt': '2026-03-01T00:00:00Z'
        }
        data['users'].append(user)
    
    sec_id = f"sec-{class_id.replace('class-', '')}-a"
    # remove existing for this class
    data['teacherAssignments'] = [
        ta for ta in data['teacherAssignments']
        if not (ta['classId'] == class_id and ta.get('isClassTeacher'))
    ]
    data['teacherAssignments'].append({
        'id': f"assign-{user['id']}-{class_id}",
        'teacherId': user['id'],
        'classId': class_id,
        'sectionId': sec_id,
        'subjectId': None,
        'isClassTeacher': True
    })

with open('data/sbb_erp_database.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print('Successfully configured all 12 class teachers!')
print('Teachers count:', len([u for u in data['users'] if u['role'] == 'teacher']))
print('Teacher assignments count:', len(data['teacherAssignments']))
