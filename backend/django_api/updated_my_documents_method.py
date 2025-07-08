    @action(detail=False, methods=['get'])
    def my_documents(self, request):
        """Get medical documents for the current user's patient profile - UPDATED VERSION"""
        try:
            user = request.user
            
            # Check if user is authenticated
            if not user.is_authenticated:
                return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Check if user has a patient profile
            try:
                patient_profile = user.get_current_patient_profile()
                if not patient_profile:
                    return Response({'detail': 'No patient profile found. Please create your profile first.'}, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                print(f"Error getting patient profile: {e}")
                return Response({'detail': 'No patient profile found. Please create your profile first.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Try to use ORM first, fall back to raw SQL if academic_year_id column doesn't exist
            try:
                # Try to get current academic year
                current_academic_year = AcademicSchoolYear.objects.filter(is_current=True).first()
                
                if current_academic_year:
                    # Get document for current academic year
                    document = MedicalDocument.objects.filter(
                        patient=patient_profile,
                        academic_year=current_academic_year
                    ).first()
                else:
                    # Get any document for the patient
                    document = MedicalDocument.objects.filter(
                        patient=patient_profile
                    ).first()
                
                if document:
                    serializer = self.get_serializer(document)
                    data = serializer.data
                    # Add computed properties
                    data['is_complete'] = document.is_complete
                    data['completion_percentage'] = document.completion_percentage
                    return Response(data)
                else:
                    # Return empty document structure
                    return Response({
                        'id': None,
                        'patient': patient_profile.id,
                        'academic_year': current_academic_year.id if current_academic_year else None,
                        'chest_xray': None,
                        'cbc': None,
                        'blood_typing': None,
                        'urinalysis': None,
                        'drug_test': None,
                        'hepa_b': None,
                        'medical_certificate': None,
                        'status': 'pending',
                        'submitted_for_review': False,
                        'reviewed_by': None,
                        'reviewed_at': None,
                        'rejection_reason': None,
                        'certificate_issued_at': None,
                        'uploaded_at': None,
                        'updated_at': None,
                        'is_complete': False,
                        'completion_percentage': 0
                    }, status=status.HTTP_200_OK)
                    
            except Exception as orm_error:
                print(f"ORM failed, trying raw SQL fallback: {orm_error}")
                
                # Fall back to raw SQL if ORM fails (for backwards compatibility)
                from django.db import connection
                
                with connection.cursor() as cursor:
                    try:
                        # Check if academic_year_id column exists
                        cursor.execute("SHOW COLUMNS FROM api_medicaldocument LIKE 'academic_year_id'")
                        has_academic_year_col = cursor.fetchone() is not None
                        
                        if has_academic_year_col:
                            # Use query with academic_year_id
                            cursor.execute("""
                                SELECT id, patient_id, academic_year_id, chest_xray, cbc, blood_typing, urinalysis, 
                                       drug_test, hepa_b, medical_certificate, status, 
                                       submitted_for_review, reviewed_by_id, reviewed_at, 
                                       rejection_reason, certificate_issued_at, uploaded_at, updated_at
                                FROM api_medicaldocument 
                                WHERE patient_id = %s 
                                ORDER BY updated_at DESC 
                                LIMIT 1
                            """, [patient_profile.id])
                        else:
                            # Use query without academic_year_id
                            cursor.execute("""
                                SELECT id, patient_id, chest_xray, cbc, blood_typing, urinalysis, 
                                       drug_test, hepa_b, medical_certificate, status, 
                                       submitted_for_review, reviewed_by_id, reviewed_at, 
                                       rejection_reason, certificate_issued_at, uploaded_at, updated_at
                                FROM api_medicaldocument 
                                WHERE patient_id = %s 
                                ORDER BY updated_at DESC 
                                LIMIT 1
                            """, [patient_profile.id])
                        
                        row = cursor.fetchone()
                        
                        if row:
                            if has_academic_year_col:
                                return Response({
                                    'id': row[0],
                                    'patient': row[1],
                                    'academic_year': row[2],
                                    'chest_xray': row[3],
                                    'cbc': row[4],
                                    'blood_typing': row[5],
                                    'urinalysis': row[6],
                                    'drug_test': row[7],
                                    'hepa_b': row[8],
                                    'medical_certificate': row[9],
                                    'status': row[10],
                                    'submitted_for_review': bool(row[11]),
                                    'reviewed_by': row[12],
                                    'reviewed_at': row[13].isoformat() if row[13] else None,
                                    'rejection_reason': row[14],
                                    'certificate_issued_at': row[15].isoformat() if row[15] else None,
                                    'uploaded_at': row[16].isoformat() if row[16] else None,
                                    'updated_at': row[17].isoformat() if row[17] else None,
                                    'is_complete': bool(row[3] and row[4] and row[5] and row[6] and row[7]),
                                    'completion_percentage': 100 if bool(row[3] and row[4] and row[5] and row[6] and row[7]) else 0
                                }, status=status.HTTP_200_OK)
                            else:
                                return Response({
                                    'id': row[0],
                                    'patient': row[1],
                                    'academic_year': None,
                                    'chest_xray': row[2],
                                    'cbc': row[3],
                                    'blood_typing': row[4],
                                    'urinalysis': row[5],
                                    'drug_test': row[6],
                                    'hepa_b': row[7],
                                    'medical_certificate': row[8],
                                    'status': row[9],
                                    'submitted_for_review': bool(row[10]),
                                    'reviewed_by': row[11],
                                    'reviewed_at': row[12].isoformat() if row[12] else None,
                                    'rejection_reason': row[13],
                                    'certificate_issued_at': row[14].isoformat() if row[14] else None,
                                    'uploaded_at': row[15].isoformat() if row[15] else None,
                                    'updated_at': row[16].isoformat() if row[16] else None,
                                    'is_complete': bool(row[2] and row[3] and row[4] and row[5] and row[6]),
                                    'completion_percentage': 100 if bool(row[2] and row[3] and row[4] and row[5] and row[6]) else 0
                                }, status=status.HTTP_200_OK)
                        else:
                            # No document found
                            return Response({
                                'id': None,
                                'patient': patient_profile.id,
                                'academic_year': None,
                                'chest_xray': None,
                                'cbc': None,
                                'blood_typing': None,
                                'urinalysis': None,
                                'drug_test': None,
                                'hepa_b': None,
                                'medical_certificate': None,
                                'status': 'pending',
                                'submitted_for_review': False,
                                'reviewed_by': None,
                                'reviewed_at': None,
                                'rejection_reason': None,
                                'certificate_issued_at': None,
                                'uploaded_at': None,
                                'updated_at': None,
                                'is_complete': False,
                                'completion_percentage': 0
                            }, status=status.HTTP_200_OK)
                            
                    except Exception as sql_error:
                        print(f"SQL fallback also failed: {sql_error}")
                        return Response({'detail': f'Database error: {str(sql_error)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
        except Exception as e:
            print(f"Error in my_documents: {e}")
            import traceback
            traceback.print_exc()
            return Response({'detail': 'Internal server error. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
