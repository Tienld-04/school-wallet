package com.ldt.transaction.mapper;

import com.ldt.transaction.dto.TransactionResponse;
import com.ldt.transaction.dto.TransferRequest;
import com.ldt.transaction.model.Transaction;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface TransactionMapper {
    Transaction toTransaction(TransferRequest transferRequest);
    TransactionResponse toTransactionResponse(Transaction transaction);
}
